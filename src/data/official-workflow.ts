/** Student-facing workflow distilled from the supplied Sanjiang University materials. */
export const OFFICIAL_WORKFLOW = [
  { key: "requirements", title: "论文规则解析", deadline: "2025-11-26", route: "/requirements", evidence: "学校通知、学院细则、写作规范" },
  { key: "topic", title: "选题", deadline: "2025-11-26", route: "/topic", evidence: "师生双向确定，专业审核" },
  { key: "taskbook", title: "任务书", deadline: "2025-12-10", route: "/task-book", evidence: "导师填写并经专业、学院审核后下达" },
  { key: "literature", title: "文献研究", deadline: "2026-01-07", route: "/literature", evidence: "开题文献不少于10篇；全文文献20篇以上" },
  { key: "proposal", title: "开题报告", deadline: "2026-01-07", route: "/proposal", evidence: "文献综述不少于1000字，导师与专业审核" },
  { key: "research", title: "研究实施", deadline: null, route: "/implementation", evidence: "按任务书开展调研、数据或设计工作" },
  { key: "first_draft", title: "初稿", deadline: null, route: "/writing", evidence: "形成论文初稿，并同步完成适用专业的外文翻译" },
  { key: "midterm", title: "中期检查", deadline: "2026-03-18", route: "/midterm", evidence: "电子签名、题目、类型、关键词、来源、方向、导师、进度与质量" },
  { key: "revision", title: "修改完善", deadline: null, route: "/guidance", evidence: "学生如实填写，指导记录不得少于6次" },
  { key: "final_draft", title: "论文定稿", deadline: null, route: "/finalization", evidence: "按导师意见完成终稿并提交" },
  { key: "plagiarism", title: "查重 / 规范", deadline: null, route: "/plagiarism", evidence: "一般不超过30%，以学校检测结果为准" },
  { key: "advisor_review", title: "指导教师评阅", deadline: null, route: "/teacher-review", evidence: "评阅合格后进入后续资格审查" },
  { key: "reviewer_review", title: "评阅教师评阅", deadline: null, route: "/teacher-review", evidence: "评阅不合格不得参加当前批次答辩" },
  { key: "inspection", title: "论文抽检", deadline: null, route: "/sampling", evidence: "材料、学分、评阅与检测结果共同审查" },
  { key: "defense_preparation", title: "答辩准备", deadline: null, route: "/defense-prep", evidence: "PPT陈述5–10分钟，准备至少3个问题" },
  { key: "defense", title: "论文答辩", deadline: "2026-05-17", route: "/defense", evidence: "第一批次；第二批次不晚于2026-06-24" },
  { key: "post_defense_revision", title: "答辩后修改", deadline: null, route: "/post-defense-revision", evidence: "按答辩意见修改，经导师审核后再次查重" },
  { key: "final_submission", title: "最终稿", deadline: "2026-05-22", route: "/final-manuscript", evidence: "第一批次最终稿；第二批次按学院通知" },
  { key: "archive", title: "材料归档", deadline: "2026-06-25", route: "/archive", evidence: "学号+姓名文件包，Word/PDF两版及全部过程材料" },
] as const;

export const OFFICIAL_RULE_SUMMARY = [
  "开题：文献综述不少于1000字，参考文献不少于10篇",
  "论文：文献20篇以上，其中外文不少于2篇、期刊不少于18篇",
  "指导：学生如实填写并经导师确认，不得少于6次",
  "答辩：PPT陈述5–10分钟，提问不少于3个",
  "归档：Word/PDF两版及全部过程材料，保持系统原文件名",
] as const;
