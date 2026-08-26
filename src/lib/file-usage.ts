import type { ProjectFileCategory } from "@/types/domain";

export type FileUsage = {
  destination: string;
  destinationLabel: string;
  nextStep: string;
};

const usages: Record<ProjectFileCategory, FileUsage> = {
  school_rule: { destination: "/requirements", destinationLabel: "论文要求", nextStep: "解析后在论文要求中核对并确认规则" },
  template: { destination: "/proposal", destinationLabel: "开题报告", nextStep: "作为填写开题或论文材料的参考模板" },
  literature: { destination: "/literature", destinationLabel: "文献库", nextStep: "补充题录、摘要与文献笔记" },
  data: { destination: "/implementation", destinationLabel: "数据与调研", nextStep: "整理数据来源、字段与分析记录" },
  proposal: { destination: "/proposal", destinationLabel: "开题报告", nextStep: "补充开题报告的研究设计与材料" },
  thesis: { destination: "/writing", destinationLabel: "正文写作", nextStep: "作为正文、提纲、格式与引用核验的来源文件" },
  translation: { destination: "/translation", destinationLabel: "外文翻译", nextStep: "关联原文、译文与自检记录" },
  review: { destination: "/teacher-review", destinationLabel: "教师评阅记录", nextStep: "归档评阅意见并创建后续修改任务" },
  defense: { destination: "/defense", destinationLabel: "答辩记录", nextStep: "归档答辩材料、问题与后续任务" },
  plagiarism: { destination: "/plagiarism", destinationLabel: "查重记录", nextStep: "记录查重报告并处理修订任务" },
  archive: { destination: "/archive", destinationLabel: "材料归档", nextStep: "纳入项目归档清单" },
  other: { destination: "/files", destinationLabel: "文件中心", nextStep: "已保存为项目资料；可重新指定更合适的导入分类" },
};

export function getFileUsage(category: ProjectFileCategory): FileUsage {
  return usages[category];
}
