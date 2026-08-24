mod secret_store;

use std::{fs, path::{Path, PathBuf}, process::Command};

use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use tauri::Manager;
use tauri_plugin_sql::{Migration, MigrationKind};
use secret_store::{SecretStore, WindowsCredentialSecretStore};

const DATABASE_URL: &str = "sqlite:thesisflow.db";

const STAGES: [(&str, &str); 19] = [
    ("requirements", "论文规则解析"), ("topic", "选题"), ("taskbook", "任务书"),
    ("literature", "文献研究"), ("proposal", "开题报告"), ("research", "研究实施"),
    ("first_draft", "初稿"), ("midterm", "中期检查"), ("revision", "修改完善"),
    ("final_draft", "论文定稿"), ("plagiarism", "查重 / 规范"), ("advisor_review", "指导教师评阅"),
    ("reviewer_review", "评阅教师评阅"), ("inspection", "论文抽检"), ("defense_preparation", "答辩准备"),
    ("defense", "论文答辩"), ("post_defense_revision", "答辩后修改"),
    ("final_submission", "最终稿"), ("archive", "材料归档"),
];

const PROJECT_FOLDERS: [&str; 12] = [
    "01_学校要求", "02_选题与任务书", "03_文献", "04_开题", "05_数据", "06_论文正文",
    "07_外文翻译", "08_导师意见", "09_查重与评阅", "10_答辩", "11_最终稿", "12_归档",
];

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateProjectRequest {
    title: String,
    school: Option<String>, college: Option<String>, major: Option<String>, grade: Option<String>,
    student_name: Option<String>, student_number: Option<String>, advisor_name: Option<String>,
    research_type: Option<String>, defense_batch: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct CreatedProject {
    id: String, title: String, school: String, college: String, major: String, grade: String,
    student_name: String, student_number: String, advisor_name: String, research_type: String,
    current_stage: String, progress: i64, defense_batch: Option<String>, created_at: String,
    updated_at: String, last_opened_at: Option<String>, project_folder: String, status: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ImportProjectFileRequest { project_id: String, source_path: String, category: String }

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ImportedProjectFile {
    id: String, project_id: String, workflow_stage_id: Option<String>, original_name: String,
    stored_name: String, relative_path: String, mime_type: Option<String>, extension: String,
    size_bytes: i64, checksum: Option<String>, file_category: String, version_label: Option<String>,
    source: String, created_at: String, updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PersistNormalizedDocumentRequest {
    id: String,
    project_id: String,
    project_file_id: String,
    parser_type: String,
    parser_version: String,
    content_hash: Option<String>,
    mime_type: Option<String>,
    language: Option<String>,
    page_count: Option<i64>,
    block_count: i64,
    text_length: i64,
    document: Value,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct PersistedDocumentParse {
    id: String, project_id: String, project_file_id: String, parser_type: String, parser_version: String,
    status: String, content_hash: Option<String>, normalized_path: String, mime_type: Option<String>, language: Option<String>,
    page_count: Option<i64>, block_count: i64, text_length: i64, error_code: Option<String>, error_message: Option<String>,
    created_at: String, updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ConvertLegacyDocRequest { project_id: String, project_file_id: String }
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ConvertedLegacyDocument { converter: String, version: Option<String>, converted_file: String, mime_type: String, bytes: Vec<u8> }

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct LocalFileBytes { bytes: Vec<u8> }

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SaveAiSecretRequest { secret_ref: String, secret_value: String }

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct SecretConfigurationStatus { configured: bool }

fn redact_secrets(input: &str) -> String {
    input.split_whitespace().map(|token| {
        let lowered = token.to_ascii_lowercase();
        if lowered.starts_with("sk_") || lowered.starts_with("rk_") || lowered.starts_with("pk_") || lowered.starts_with("bearer") || lowered.contains("api_key=") || lowered.contains("secret=") || lowered.contains("token=") { "[REDACTED]" } else { token }
    }).collect::<Vec<_>>().join(" ")
}

#[tauri::command]
async fn save_ai_secret(request: SaveAiSecretRequest) -> Result<SecretConfigurationStatus, String> {
    // This command deliberately returns only configured state; the secret is never put into UI state or logs.
    WindowsCredentialSecretStore.save_secret(&request.secret_ref, &request.secret_value).map_err(|error| redact_secrets(&error))?;
    Ok(SecretConfigurationStatus { configured: true })
}

#[tauri::command]
async fn ai_secret_status(secret_ref: String) -> Result<SecretConfigurationStatus, String> {
    let configured = WindowsCredentialSecretStore.has_secret(&secret_ref).map_err(|error| redact_secrets(&error))?;
    Ok(SecretConfigurationStatus { configured })
}

#[tauri::command]
async fn delete_ai_secret(secret_ref: String) -> Result<SecretConfigurationStatus, String> {
    WindowsCredentialSecretStore.delete_secret(&secret_ref).map_err(|error| redact_secrets(&error))?;
    Ok(SecretConfigurationStatus { configured: false })
}

fn file_directory(category: &str) -> Option<&'static str> {
    match category {
        "school_rule" | "template" => Some("01_学校要求"), "literature" => Some("03_文献"),
        "data" => Some("05_数据"), "proposal" => Some("04_开题"), "thesis" => Some("06_论文正文"),
        "translation" => Some("07_外文翻译"), "review" | "plagiarism" => Some("09_查重与评阅"),
        "defense" => Some("10_答辩"), "archive" => Some("12_归档"), "other" => Some(".thesisflow/imports"), _ => None,
    }
}
fn supported_extension(path: &Path) -> Result<String, String> {
    let extension = path.extension().and_then(|value| value.to_str()).unwrap_or_default().to_ascii_lowercase();
    if ["doc", "docx", "pdf", "xlsx", "xls", "csv", "bib", "ris", "txt", "md"].contains(&extension.as_str()) { Ok(extension) }
    else { Err("仅支持 .doc、.docx、.pdf、.xlsx、.xls、.csv、.bib、.ris、.txt、.md 文件。".to_owned()) }
}
fn mime_type(extension: &str) -> Option<&'static str> { match extension {
    "pdf" => Some("application/pdf"), "doc" => Some("application/msword"),
    "docx" => Some("application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
    "xls" => Some("application/vnd.ms-excel"), "xlsx" => Some("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
    "csv" => Some("text/csv"), "bib" => Some("application/x-bibtex"), "ris" => Some("application/x-research-info-systems"),
    "txt" | "md" => Some("text/plain"), _ => None,
}}
fn is_safe_relative_path(relative: &str) -> bool { !Path::new(relative).is_absolute() && !Path::new(relative).components().any(|component| matches!(component, std::path::Component::ParentDir)) }
async fn database_pool(app: &tauri::AppHandle) -> Result<sqlx::SqlitePool, String> {
    let database_path = app.path().app_data_dir().map_err(|error| format!("无法打开本地数据库：{error}"))?.join("thesisflow.db");
    let options = SqliteConnectOptions::new().filename(&database_path).foreign_keys(true).create_if_missing(false);
    SqlitePoolOptions::new().max_connections(1).connect_with(options).await.map_err(|error| format!("无法打开本地数据库：{error}"))
}

fn project_root(app: &tauri::AppHandle, project_id: &str) -> Result<PathBuf, String> {
    app.path().app_data_dir()
        .map(|path| path.join("ThesisFlow").join("Projects").join(project_id))
        .map_err(|error| format!("无法确定本地项目目录：{error}"))
}

fn create_project_directory(temp_root: &PathBuf, project: &CreatedProject) -> Result<(), String> {
    fs::create_dir_all(temp_root).map_err(|error| format!("无法创建项目目录：{error}"))?;
    for folder in PROJECT_FOLDERS { fs::create_dir_all(temp_root.join(folder)).map_err(|error| format!("无法创建项目子目录：{error}"))?; }
    fs::create_dir_all(temp_root.join(".thesisflow")).map_err(|error| format!("无法创建项目元数据目录：{error}"))?;
    let project_json = serde_json::to_vec_pretty(project).map_err(|error| format!("无法生成 project.json：{error}"))?;
    fs::write(temp_root.join("project.json"), project_json).map_err(|error| format!("无法写入 project.json：{error}"))
}

#[tauri::command]
async fn create_local_project(app: tauri::AppHandle, request: CreateProjectRequest) -> Result<CreatedProject, String> {
    let title = request.title.trim().to_owned();
    if title.is_empty() { return Err("项目名称不能为空。".to_owned()); }
    let id = uuid::Uuid::new_v4().to_string();
    let timestamp = chrono::Utc::now().to_rfc3339();
    let root = project_root(&app, &id)?;
    let temp_root = root.with_file_name(format!(".{id}.creating"));
    if root.exists() || temp_root.exists() { return Err("项目目录已存在，请重试。".to_owned()); }

    let project = CreatedProject {
        id: id.clone(), title, school: request.school.unwrap_or_default(), college: request.college.unwrap_or_default(), major: request.major.unwrap_or_default(), grade: request.grade.unwrap_or_default(),
        student_name: request.student_name.unwrap_or_default(), student_number: request.student_number.unwrap_or_default(), advisor_name: request.advisor_name.unwrap_or_default(), research_type: request.research_type.unwrap_or_default(),
        current_stage: "requirements".to_owned(), progress: 0, defense_batch: request.defense_batch,
        created_at: timestamp.clone(), updated_at: timestamp.clone(), last_opened_at: Some(timestamp.clone()), project_folder: root.to_string_lossy().into_owned(), status: "active".to_owned(),
    };

    create_project_directory(&temp_root, &project)?;
    let database_path = app.path().app_data_dir().map_err(|error| format!("无法打开本地数据库：{error}"))?.join("thesisflow.db");
    let options = SqliteConnectOptions::new().filename(&database_path).foreign_keys(true).create_if_missing(false);
    let pool = SqlitePoolOptions::new().max_connections(1).connect_with(options).await.map_err(|error| { let _ = fs::remove_dir_all(&temp_root); format!("无法打开本地数据库：{error}") })?;
    let mut transaction = pool.begin().await.map_err(|error| { let _ = fs::remove_dir_all(&temp_root); format!("无法开始项目创建事务：{error}") })?;
    let write_result: Result<(), sqlx::Error> = async {
        sqlx::query("INSERT INTO thesis_projects (id,title,school,college,major,grade,student_name,student_number,advisor_name,research_type,current_stage,progress,defense_batch,created_at,updated_at,last_opened_at,project_folder,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
            .bind(&project.id).bind(&project.title).bind(&project.school).bind(&project.college).bind(&project.major).bind(&project.grade).bind(&project.student_name).bind(&project.student_number).bind(&project.advisor_name).bind(&project.research_type).bind(&project.current_stage).bind(project.progress).bind(&project.defense_batch).bind(&project.created_at).bind(&project.updated_at).bind(&project.last_opened_at).bind(&project.project_folder).bind(&project.status).execute(&mut *transaction).await?;
        for (index, (stage_key, stage_title)) in STAGES.iter().enumerate() {
            let status = if index == 0 { "in_progress" } else { "not_started" };
            let started_at = if index == 0 { Some(&timestamp) } else { None };
            sqlx::query("INSERT INTO workflow_stages (id,project_id,stage_key,stage_number,title,status,started_at,completed_at,deadline,progress,sort_order,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)")
                .bind(uuid::Uuid::new_v4().to_string()).bind(&project.id).bind(stage_key).bind((index + 1) as i64).bind(stage_title).bind(status).bind(started_at).bind(Option::<String>::None).bind(Option::<String>::None).bind(0_i64).bind((index + 1) as i64).bind(&timestamp).bind(&timestamp).execute(&mut *transaction).await?;
        }
        Ok(())
    }.await;
    if let Err(error) = write_result { let _ = transaction.rollback().await; let _ = fs::remove_dir_all(&temp_root); return Err(format!("项目创建失败，数据库已回滚：{error}")); }
    if let Err(error) = transaction.commit().await { let _ = fs::remove_dir_all(&temp_root); return Err(format!("项目创建失败，数据库未提交：{error}")); }
    if let Err(error) = fs::rename(&temp_root, &root) {
        let _ = sqlx::query("DELETE FROM thesis_projects WHERE id = ?").bind(&project.id).execute(&pool).await;
        let _ = fs::remove_dir_all(&temp_root);
        return Err(format!("项目目录提交失败，数据库项目已回滚：{error}"));
    }
    Ok(project)
}

#[tauri::command]
async fn delete_local_project(app: tauri::AppHandle, project_id: String) -> Result<(), String> {
    let root = project_root(&app, &project_id)?;
    let database_path = app.path().app_data_dir().map_err(|error| format!("无法打开本地数据库：{error}"))?.join("thesisflow.db");
    let options = SqliteConnectOptions::new().filename(&database_path).foreign_keys(true).create_if_missing(false);
    let pool = SqlitePoolOptions::new().max_connections(1).connect_with(options).await.map_err(|error| format!("无法打开本地数据库：{error}"))?;
    let stored_folder = sqlx::query_scalar::<_, String>("SELECT project_folder FROM thesis_projects WHERE id = ?")
        .bind(&project_id).fetch_optional(&pool).await.map_err(|error| format!("无法读取项目记录：{error}"))?
        .ok_or_else(|| "未找到指定项目。".to_owned())?;
    if PathBuf::from(stored_folder) != root { return Err("项目目录校验失败，已取消删除。".to_owned()); }
    if !root.exists() { return Err("项目目录不存在，已取消删除数据库记录。".to_owned()); }

    let deleting_root = root.with_file_name(format!(".{project_id}.deleting"));
    if deleting_root.exists() { return Err("检测到未完成的项目删除，请先处理本地目录。".to_owned()); }
    fs::rename(&root, &deleting_root).map_err(|error| format!("无法准备删除项目目录，数据库未变更：{error}"))?;
    if let Err(error) = fs::remove_dir_all(&deleting_root) {
        let _ = fs::rename(&deleting_root, &root);
        return Err(format!("无法删除项目目录，数据库未变更：{error}"));
    }
    let result = sqlx::query("DELETE FROM thesis_projects WHERE id = ?").bind(&project_id).execute(&pool).await;
    match result {
        Ok(result) if result.rows_affected() == 1 => Ok(()),
        Ok(_) => Err("项目记录未删除；本地目录已删除，请联系开发人员恢复一致性。".to_owned()),
        Err(error) => Err(format!("项目记录删除失败；本地目录已删除，请联系开发人员恢复一致性：{error}")),
    }
}

#[tauri::command]
async fn import_project_file(app: tauri::AppHandle, request: ImportProjectFileRequest) -> Result<ImportedProjectFile, String> {
    let source = PathBuf::from(&request.source_path);
    if !source.is_file() { return Err("导入源文件不存在或不是普通文件。".to_owned()); }
    let extension = supported_extension(&source)?;
    let directory = file_directory(&request.category).ok_or_else(|| "不支持的文件分类。".to_owned())?;
    let root = project_root(&app, &request.project_id)?;
    let pool = database_pool(&app).await?;
    let stored_folder = sqlx::query_scalar::<_, String>("SELECT project_folder FROM thesis_projects WHERE id = ?").bind(&request.project_id).fetch_optional(&pool).await.map_err(|error| format!("无法读取项目记录：{error}"))?.ok_or_else(|| "未找到当前项目。".to_owned())?;
    if PathBuf::from(stored_folder) != root || !root.is_dir() { return Err("项目目录校验失败，已取消导入。".to_owned()); }
    let id = uuid::Uuid::new_v4().to_string();
    let original_name = source.file_name().and_then(|name| name.to_str()).ok_or_else(|| "文件名无效。".to_owned())?.to_owned();
    let stored_name = format!("{id}.{extension}");
    let relative_path = format!("{directory}/{stored_name}");
    let target = root.join(&relative_path);
    let temp_target = target.with_file_name(format!(".{stored_name}.importing"));
    fs::create_dir_all(target.parent().ok_or_else(|| "无法确定导入目录。".to_owned())?).map_err(|error| format!("无法创建导入目录：{error}"))?;
    fs::copy(&source, &temp_target).map_err(|error| format!("复制文件失败，未写入数据库：{error}"))?;
    if let Err(error) = fs::rename(&temp_target, &target) { let _ = fs::remove_file(&temp_target); return Err(format!("提交导入文件失败，未写入数据库：{error}")); }
    let timestamp = chrono::Utc::now().to_rfc3339();
    let size_bytes = fs::metadata(&target).map_err(|error| format!("无法读取已复制文件：{error}"))?.len() as i64;
    let insert = sqlx::query("INSERT INTO project_files (id,project_id,workflow_stage_id,original_name,stored_name,relative_path,mime_type,extension,size_bytes,checksum,file_category,version_label,source,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
        .bind(&id).bind(&request.project_id).bind(Option::<String>::None).bind(&original_name).bind(&stored_name).bind(&relative_path).bind(mime_type(&extension)).bind(&extension).bind(size_bytes).bind(Option::<String>::None).bind(&request.category).bind(Option::<String>::None).bind("imported").bind(&timestamp).bind(&timestamp).execute(&pool).await;
    if let Err(error) = insert { let _ = fs::remove_file(&target); return Err(format!("文件已复制但登记失败，已清理副本：{error}")); }
    Ok(ImportedProjectFile { id, project_id: request.project_id, workflow_stage_id: None, original_name, stored_name, relative_path, mime_type: mime_type(&extension).map(str::to_owned), extension, size_bytes, checksum: None, file_category: request.category, version_label: None, source: "imported".to_owned(), created_at: timestamp.clone(), updated_at: timestamp })
}

#[tauri::command]
async fn remove_project_file(app: tauri::AppHandle, file_id: String) -> Result<(), String> {
    let pool = database_pool(&app).await?;
    let row = sqlx::query_as::<_, (String, String, String)>("SELECT project_id, relative_path, (SELECT project_folder FROM thesis_projects WHERE id = project_files.project_id) FROM project_files WHERE id = ?").bind(&file_id).fetch_optional(&pool).await.map_err(|error| format!("无法读取文件记录：{error}"))?.ok_or_else(|| "未找到项目文件。".to_owned())?;
    let (project_id, relative_path, stored_folder) = row;
    let root = project_root(&app, &project_id)?;
    if PathBuf::from(stored_folder) != root || !is_safe_relative_path(&relative_path) { return Err("文件路径校验失败，已取消移除。".to_owned()); }
    let target = root.join(&relative_path);
    if !target.is_file() { return Err("本地文件不存在，已保留数据库记录。".to_owned()); }
    let deleting = target.with_file_name(format!(".{}.deleting", file_id));
    fs::rename(&target, &deleting).map_err(|error| format!("无法准备移除文件，数据库未变更：{error}"))?;
    if let Err(error) = fs::remove_file(&deleting) { let _ = fs::rename(&deleting, &target); return Err(format!("无法移除本地文件，数据库未变更：{error}")); }
    if let Err(error) = sqlx::query("DELETE FROM project_files WHERE id = ?").bind(&file_id).execute(&pool).await { return Err(format!("文件记录删除失败；本地文件已删除：{error}")); }
    Ok(())
}

#[tauri::command]
async fn open_project_file_location(app: tauri::AppHandle, file_id: String) -> Result<(), String> {
    let pool = database_pool(&app).await?;
    let row = sqlx::query_as::<_, (String, String, String)>("SELECT project_id, relative_path, (SELECT project_folder FROM thesis_projects WHERE id = project_files.project_id) FROM project_files WHERE id = ?").bind(&file_id).fetch_optional(&pool).await.map_err(|error| format!("无法读取文件记录：{error}"))?.ok_or_else(|| "未找到项目文件。".to_owned())?;
    let (project_id, relative_path, stored_folder) = row; let root = project_root(&app, &project_id)?;
    if PathBuf::from(stored_folder) != root || !is_safe_relative_path(&relative_path) { return Err("文件路径校验失败，已取消打开。".to_owned()); }
    let target = root.join(relative_path); if !target.is_file() { return Err("本地文件不存在。".to_owned()); }
    Command::new("explorer.exe").arg("/select,").arg(target).spawn().map_err(|error| format!("无法打开系统文件管理器：{error}"))?; Ok(())
}

#[tauri::command]
async fn read_project_file_bytes(app: tauri::AppHandle, file_id: String) -> Result<LocalFileBytes, String> {
    let pool = database_pool(&app).await?;
    let row = sqlx::query_as::<_, (String, String, String)>("SELECT project_id, relative_path, (SELECT project_folder FROM thesis_projects WHERE id = project_files.project_id) FROM project_files WHERE id = ?")
        .bind(&file_id).fetch_optional(&pool).await.map_err(|error| format!("无法读取项目文件：{error}"))?
        .ok_or_else(|| "未找到项目文件。".to_owned())?;
    let (project_id, relative_path, stored_folder) = row;
    let root = project_root(&app, &project_id)?;
    if PathBuf::from(stored_folder) != root || !is_safe_relative_path(&relative_path) { return Err("文件路径校验失败，已取消读取。".to_owned()); }
    let target = root.join(relative_path);
    let bytes = fs::read(&target).map_err(|error| format!("无法读取本地项目文件：{error}"))?;
    Ok(LocalFileBytes { bytes })
}

#[tauri::command]
async fn normalized_document_exists(app: tauri::AppHandle, parse_id: String) -> Result<bool, String> {
    let pool = database_pool(&app).await?;
    let row = sqlx::query_as::<_, (String, String)>("SELECT project_id, normalized_path FROM document_parses WHERE id = ? AND status = 'parsed'")
        .bind(&parse_id).fetch_optional(&pool).await.map_err(|error| format!("无法读取解析记录：{error}"))?;
    let Some((project_id, normalized_path)) = row else { return Ok(false); };
    if !is_safe_relative_path(&normalized_path) { return Ok(false); }
    Ok(project_root(&app, &project_id)?.join(normalized_path).is_file())
}

#[tauri::command]
async fn persist_normalized_document(app: tauri::AppHandle, request: PersistNormalizedDocumentRequest) -> Result<PersistedDocumentParse, String> {
    let document_id = request.document.get("documentId").and_then(Value::as_str);
    let document_file_id = request.document.get("projectFileId").and_then(Value::as_str);
    if document_id != Some(request.id.as_str()) || document_file_id != Some(request.project_file_id.as_str()) {
        return Err("规范化文档与解析记录不匹配。".to_owned());
    }
    let root = project_root(&app, &request.project_id)?;
    let pool = database_pool(&app).await?;
    let file_project_id = sqlx::query_scalar::<_, String>("SELECT project_id FROM project_files WHERE id = ?")
        .bind(&request.project_file_id).fetch_optional(&pool).await.map_err(|error| format!("无法读取项目文件：{error}"))?
        .ok_or_else(|| "未找到项目文件。".to_owned())?;
    if file_project_id != request.project_id || !root.is_dir() { return Err("项目文件不属于当前项目，已取消保存解析结果。".to_owned()); }

    let parsed_directory = root.join(".thesisflow").join("parsed");
    fs::create_dir_all(&parsed_directory).map_err(|error| format!("无法创建解析目录：{error}"))?;
    let normalized_path = format!(".thesisflow/parsed/{}.json", request.id);
    let target = root.join(&normalized_path);
    let temporary = parsed_directory.join(format!(".{}.writing", request.id));
    if target.exists() || temporary.exists() { return Err("解析记录已存在，已取消覆盖。".to_owned()); }
    let serialized = serde_json::to_vec_pretty(&request.document).map_err(|error| format!("无法序列化解析结果：{error}"))?;
    fs::write(&temporary, serialized).map_err(|error| format!("无法写入解析临时文件：{error}"))?;
    if let Err(error) = fs::rename(&temporary, &target) { let _ = fs::remove_file(&temporary); return Err(format!("无法原子提交解析结果：{error}")); }

    let timestamp = chrono::Utc::now().to_rfc3339();
    let insert = sqlx::query("UPDATE document_parses SET status = 'parsed', content_hash = ?, normalized_path = ?, mime_type = ?, language = ?, page_count = ?, block_count = ?, text_length = ?, error_code = NULL, error_message = NULL, updated_at = ? WHERE id = ? AND project_id = ? AND project_file_id = ?")
        .bind(&request.content_hash).bind(&normalized_path).bind(&request.mime_type).bind(&request.language).bind(request.page_count)
        .bind(request.block_count).bind(request.text_length).bind(&timestamp).bind(&request.id).bind(&request.project_id).bind(&request.project_file_id).execute(&pool).await;
    if let Err(error) = insert { let _ = fs::remove_file(&target); return Err(format!("无法更新解析元数据，已清理本地结果：{error}")); }
    let inserted = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM document_parses WHERE id = ?").bind(&request.id).fetch_one(&pool).await.map_err(|error| { let _ = fs::remove_file(&target); format!("无法确认解析元数据：{error}") })?;
    if inserted != 1 { let _ = fs::remove_file(&target); return Err("解析记录不存在，已清理本地结果。".to_owned()); }
    Ok(PersistedDocumentParse { id: request.id, project_id: request.project_id, project_file_id: request.project_file_id, parser_type: request.parser_type, parser_version: request.parser_version, status: "parsed".to_owned(), content_hash: request.content_hash, normalized_path, mime_type: request.mime_type, language: request.language, page_count: request.page_count, block_count: request.block_count, text_length: request.text_length, error_code: None, error_message: None, created_at: timestamp.clone(), updated_at: timestamp })
}

#[tauri::command]
async fn convert_legacy_doc(app: tauri::AppHandle, request: ConvertLegacyDocRequest) -> Result<ConvertedLegacyDocument, String> {
    let root = project_root(&app, &request.project_id)?;
    let pool = database_pool(&app).await?;
    let (file_project_id, relative_path, extension): (String, String, String) = sqlx::query_as("SELECT project_id, relative_path, extension FROM project_files WHERE id = ?")
        .bind(&request.project_file_id).fetch_optional(&pool).await.map_err(|error| format!("无法读取 legacy 文件：{error}"))?
        .ok_or_else(|| "未找到 legacy .doc 文件。".to_owned())?;
    if file_project_id != request.project_id || extension.to_ascii_lowercase() != "doc" || !is_safe_relative_path(&relative_path) { return Err("legacy .doc 文件校验失败。".to_owned()); }
    let source = root.join(relative_path); if !source.is_file() { return Err("原始 .doc 文件不存在；已保留项目记录。".to_owned()); }
    let converter_path = Command::new("where.exe").arg("soffice.exe").output().ok()
        .filter(|output| output.status.success()).and_then(|output| String::from_utf8(output.stdout).ok()).and_then(|paths| paths.lines().next().map(str::trim).filter(|path| !path.is_empty()).map(str::to_owned))
        .ok_or_else(|| "未检测到本机 LibreOffice converter；请另存为 DOCX/PDF 后重试。".to_owned())?;
    let converted_directory = root.join(".thesisflow").join("converted");
    let working_directory = root.join(".thesisflow").join("converting").join(&request.project_file_id);
    fs::create_dir_all(&converted_directory).map_err(|error| format!("无法创建转换目录：{error}"))?;
    if working_directory.exists() { return Err("检测到未完成的 legacy 转换，请稍后重试。".to_owned()); }
    fs::create_dir_all(&working_directory).map_err(|error| format!("无法创建转换临时目录：{error}"))?;
    let working_source = working_directory.join(format!("{}.doc", request.project_file_id));
    let output = converted_directory.join(format!("{}.docx", request.project_file_id));
    let result = (|| -> Result<ConvertedLegacyDocument, String> {
        fs::copy(&source, &working_source).map_err(|error| format!("无法准备 legacy 转换：{error}"))?;
        let command = Command::new(&converter_path).args(["--headless", "--convert-to", "docx", "--outdir"]).arg(&converted_directory).arg(&working_source).output().map_err(|error| format!("无法启动 converter：{error}"))?;
        if !command.status.success() || !output.is_file() { return Err("converter 未能生成 DOCX；原 .doc 未改变。".to_owned()); }
        let version = Command::new(&converter_path).arg("--version").output().ok().and_then(|value| String::from_utf8(value.stdout).ok()).map(|value| value.trim().to_owned()).filter(|value| !value.is_empty());
        let bytes = fs::read(&output).map_err(|error| format!("无法读取转换产物：{error}"))?;
        Ok(ConvertedLegacyDocument { converter: "LibreOffice".to_owned(), version, converted_file: format!(".thesisflow/converted/{}.docx", request.project_file_id), mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document".to_owned(), bytes })
    })();
    let _ = fs::remove_dir_all(&working_directory);
    result
}

fn migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "create_phase_2_core_entities",
            sql: include_str!("../migrations/0001_core_entities.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "normalize_workflow_statuses",
            sql: include_str!("../migrations/0002_workflow_statuses.sql"),
            kind: MigrationKind::Up,
        },
        Migration { version: 3, description: "normalize_project_file_categories", sql: include_str!("../migrations/0003_project_file_categories.sql"), kind: MigrationKind::Up },
        Migration { version: 4, description: "normalize_tasks_and_advisor_sessions", sql: include_str!("../migrations/0004_tasks_and_advisor_sessions.sql"), kind: MigrationKind::Up },
        Migration { version: 5, description: "normalize_advisor_session_statuses", sql: include_str!("../migrations/0005_normalize_advisor_session_statuses.sql"), kind: MigrationKind::Up },
        Migration { version: 6, description: "create_phase_3_document_parsing_and_rules", sql: include_str!("../migrations/0006_document_parsing_and_rules.sql"), kind: MigrationKind::Up },
        Migration { version: 7, description: "allow_document_parse_history", sql: include_str!("../migrations/0007_allow_parse_history.sql"), kind: MigrationKind::Up },
        Migration { version: 8, description: "create_phase_4_ai_infrastructure", sql: include_str!("../migrations/0008_phase4_ai_infrastructure.sql"), kind: MigrationKind::Up },
    ]
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(DATABASE_URL, migrations())
                .build(),
        )
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![create_local_project, delete_local_project, import_project_file, remove_project_file, open_project_file_location, read_project_file_bytes, normalized_document_exists, persist_normalized_document, convert_legacy_doc, save_ai_secret, ai_secret_status, delete_ai_secret])
        .run(tauri::generate_context!())
        .expect("error while running ThesisFlow");
}

#[cfg(test)]
mod tests {
    use super::{redact_secrets, STAGES};
    use crate::secret_store::{FakeSecretStore, SecretStore};
    use sqlx::SqlitePool;

    async fn execute_migrations_through_v5(pool: &SqlitePool) {
        for migration in [
            include_str!("../migrations/0001_core_entities.sql"),
            include_str!("../migrations/0002_workflow_statuses.sql"),
            include_str!("../migrations/0003_project_file_categories.sql"),
            include_str!("../migrations/0004_tasks_and_advisor_sessions.sql"),
            include_str!("../migrations/0005_normalize_advisor_session_statuses.sql"),
        ] { sqlx::query(migration).execute(pool).await.unwrap(); }
    }

    async fn execute_migrations_through_v7(pool: &SqlitePool) {
        execute_migrations_through_v5(pool).await;
        sqlx::query(include_str!("../migrations/0006_document_parsing_and_rules.sql")).execute(pool).await.unwrap();
        sqlx::query(include_str!("../migrations/0007_allow_parse_history.sql")).execute(pool).await.unwrap();
    }

    #[test]
    fn initializes_all_nineteen_workflow_stages_in_order() {
        assert_eq!(STAGES.len(), 19);
        assert_eq!(STAGES[0].0, "requirements");
        assert_eq!(STAGES[18].0, "archive");
        assert!(STAGES.windows(2).all(|pair| pair[0].0 != pair[1].0));
    }

    #[test]
    fn migration_v6_preserves_phase_2_data_and_adds_rule_tables() {
        tauri::async_runtime::block_on(async {
            let pool = sqlx::sqlite::SqlitePoolOptions::new().max_connections(1).connect("sqlite::memory:").await.unwrap();
            execute_migrations_through_v5(&pool).await;
            sqlx::query("INSERT INTO thesis_projects (id,title,created_at,updated_at) VALUES ('project-1','existing project','now','now')").execute(&pool).await.unwrap();
            sqlx::query("INSERT INTO project_files (id,project_id,original_name,stored_name,relative_path,created_at,updated_at) VALUES ('file-1','project-1','rules.md','rules.md','06_论文正文/rules.md','now','now')").execute(&pool).await.unwrap();
            sqlx::query(include_str!("../migrations/0006_document_parsing_and_rules.sql")).execute(&pool).await.unwrap();
            let preserved: (String, String) = sqlx::query_as("SELECT title, project_folder FROM thesis_projects WHERE id = 'project-1'").fetch_one(&pool).await.unwrap();
            let files: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM project_files WHERE project_id = 'project-1'").fetch_one(&pool).await.unwrap();
            let tables: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name IN ('document_parses','rule_candidates','thesis_rules','rule_conflicts','rule_audit_log')").fetch_one(&pool).await.unwrap();
            assert_eq!(preserved.0, "existing project");
            assert_eq!(preserved.1, "");
            assert_eq!(files, 1);
            assert_eq!(tables, 5);
        });
    }

    #[test]
    fn migration_v7_preserves_parse_rows_and_allows_parse_history() {
        tauri::async_runtime::block_on(async {
            let pool = sqlx::sqlite::SqlitePoolOptions::new().max_connections(1).connect("sqlite::memory:").await.unwrap();
            execute_migrations_through_v5(&pool).await;
            sqlx::query("INSERT INTO thesis_projects (id,title,created_at,updated_at) VALUES ('p','project','now','now')").execute(&pool).await.unwrap();
            sqlx::query("INSERT INTO project_files (id,project_id,original_name,stored_name,relative_path,created_at,updated_at) VALUES ('f','p','a.txt','a.txt','06_论文正文/a.txt','now','now')").execute(&pool).await.unwrap();
            sqlx::query(include_str!("../migrations/0006_document_parsing_and_rules.sql")).execute(&pool).await.unwrap();
            sqlx::query("INSERT INTO document_parses (id,project_id,project_file_id,parser_type,parser_version,status,block_count,text_length,created_at,updated_at) VALUES ('old','p','f','txt','1','stale',0,0,'now','now')").execute(&pool).await.unwrap();
            sqlx::query(include_str!("../migrations/0007_allow_parse_history.sql")).execute(&pool).await.unwrap();
            sqlx::query("INSERT INTO document_parses (id,project_id,project_file_id,parser_type,parser_version,status,block_count,text_length,created_at,updated_at) VALUES ('new','p','f','txt','1','parsed',0,0,'now','now')").execute(&pool).await.unwrap();
            let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM document_parses WHERE project_file_id = 'f'").fetch_one(&pool).await.unwrap();
            assert_eq!(count, 2);
        });
    }

    #[test]
    fn migration_v7_to_v8_preserves_existing_data_and_never_adds_plaintext_secret_columns() {
        tauri::async_runtime::block_on(async {
            let pool = sqlx::sqlite::SqlitePoolOptions::new().max_connections(1).connect("sqlite::memory:").await.unwrap();
            execute_migrations_through_v7(&pool).await;
            sqlx::query("INSERT INTO thesis_projects (id,title,created_at,updated_at) VALUES ('p','existing','now','now')").execute(&pool).await.unwrap();
            sqlx::query(include_str!("../migrations/0008_phase4_ai_infrastructure.sql")).execute(&pool).await.unwrap();
            let preserved: String = sqlx::query_scalar("SELECT title FROM thesis_projects WHERE id = 'p'").fetch_one(&pool).await.unwrap();
            let tables: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name IN ('ai_provider_configs','ai_runs','ai_run_outputs','ai_usage_daily')").fetch_one(&pool).await.unwrap();
            let forbidden: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM pragma_table_info('ai_provider_configs') WHERE lower(name) IN ('api_key','secret_value','secret','key')").fetch_one(&pool).await.unwrap();
            sqlx::query("INSERT INTO ai_runs (id,project_id,task_key,provider_key,model_id,prompt_template_key,prompt_template_version,context_manifest_json,status,started_at) VALUES ('run','p','task','fake','fake-text-v1','template','1','{}','queued','now')").execute(&pool).await.unwrap();
            assert_eq!(preserved, "existing");
            assert_eq!(tables, 4);
            assert_eq!(forbidden, 0);
        });
    }

    #[test]
    fn fake_secret_store_fulfills_the_secret_contract() {
        let store = FakeSecretStore::new();
        assert!(!store.has_secret("test/ref").unwrap());
        store.save_secret("test/ref", "sk_test_secret_value").unwrap();
        assert!(store.has_secret("test/ref").unwrap());
        assert_eq!(store.get_secret("test/ref").unwrap(), "sk_test_secret_value");
        store.delete_secret("test/ref").unwrap();
        assert!(!store.has_secret("test/ref").unwrap());
    }

    #[test]
    fn redacts_common_secret_shapes_before_errors_are_exposed() {
        assert!(!redact_secrets("failed Bearer sk_abcdefghijklm").contains("sk_abcdefghijklm"));
        assert!(!redact_secrets("api_key=super-secret-value").contains("super-secret-value"));
    }
}
