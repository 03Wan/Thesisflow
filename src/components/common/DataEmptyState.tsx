import { DatabaseZap } from "lucide-react";

export function DataEmptyState({ title = "暂无真实数据", description = "此页面已停止加载演示数据；关联真实文件或记录后再显示内容。" }: { title?: string; description?: string }) {
  return (
    <section className="project-required-state" aria-label={title}>
      <span className="project-required-icon"><DatabaseZap size={24} /></span>
      <div><h2>{title}</h2><p>{description}</p></div>
    </section>
  );
}
