import { AppError, toAppError } from "@/lib/app-error";
import { invoke } from "@tauri-apps/api/core";
import { FileRepository } from "@/repositories/fileRepository";
import type { ProjectFile } from "@/types/domain";
const now=()=>new Date().toISOString();
export class FileService {
  constructor(private readonly repository=new FileRepository()){}
  async list(projectId:string){try{return await this.repository.listByProject(projectId);}catch(error){throw toAppError(error,"无法加载项目文件。");}}
  async register(file:ProjectFile){try{return await this.repository.create(file);}catch(error){throw toAppError(error,"无法登记项目文件。");}}
  async update(id:string,changes:Partial<Omit<ProjectFile,"id"|"projectId"|"createdAt">>){const result=await this.repository.update(id,{...changes,updatedAt:now()});if(!result)throw new AppError("not_found","未找到项目文件。");return result;}
  async remove(id:string){try{await this.repository.delete(id);}catch(error){throw toAppError(error,"无法删除项目文件记录。");}}
  async importFromPath(projectId: string, sourcePath: string, category: ProjectFile["fileCategory"]): Promise<ProjectFile> { try { return await invoke<ProjectFile>("import_project_file", { request: { projectId, sourcePath, category } }); } catch (error) { throw toAppError(error, "无法导入文件。"); } }
  async removeFromProject(id: string) { try { await invoke("remove_project_file", { fileId: id }); } catch (error) { throw toAppError(error, "无法从项目移除文件。"); } }
  async openLocation(id: string) { try { await invoke("open_project_file_location", { fileId: id }); } catch (error) { throw toAppError(error, "无法打开文件位置。"); } }
}
export const fileService=new FileService();
