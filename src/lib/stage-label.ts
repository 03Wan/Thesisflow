const stageLabels: Record<string, string> = {
  requirements: "论文要求",
  topic: "选题",
  taskbook: "任务书",
  literature: "文献研究",
  proposal: "开题报告",
  research: "研究实施",
  implementation: "数据 / 调研",
  first_draft: "论文初稿",
  midterm: "中期检查",
  revision: "修改完善",
  final_draft: "论文定稿",
  plagiarism: "查重检查",
  citation_check: "引用核验",
  format_check: "格式检查",
  inspection: "论文抽检",
  defense_preparation: "答辩准备",
  defense: "论文答辩",
  post_defense_revision: "答辩后修改",
  final_submission: "最终稿",
  archive: "材料归档",
};

export const stageLabel = (value?: string | null) => value ? stageLabels[value] ?? value : "未选择";
