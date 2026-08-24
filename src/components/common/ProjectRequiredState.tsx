import { ArrowRight, FolderOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function ProjectRequiredState({
  title = "请先打开论文项目",
  description = "打开现有项目或新建项目后，这里的内容和操作会自动加载。",
}: {
  title?: string;
  description?: string;
}) {
  const navigate = useNavigate();
  return (
    <section className="project-required-state" aria-label={title}>
      <span className="project-required-icon"><FolderOpen size={24} /></span>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <button onClick={() => navigate("/projects")}>前往项目管理 <ArrowRight size={15} /></button>
    </section>
  );
}
