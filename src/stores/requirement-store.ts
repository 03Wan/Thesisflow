import { create } from "zustand";
import { requirementService } from "@/services/requirementService";
import type { ThesisRequirement } from "@/types/domain";
type RequirementStore={projectId:string|null;requirements:ThesisRequirement[];load:(projectId:string)=>Promise<void>};

const browserRequirements = (projectId: string): ThesisRequirement[] => {
  const timestamp = new Date().toISOString();
  return [
    ["body_words", "正文字数", 7643, 10000, "字"],
    ["references", "参考文献", 17, 20, "篇"],
    ["foreign_references", "外文文献", 3, 2, "篇"],
    ["translation_words", "外文翻译", 2460, 3000, "字"],
  ].map(([requirementKey, label, currentValue, targetValue, unit], index) => ({
    id: `browser-requirement-${projectId}-${index}`,
    projectId,
    requirementKey: String(requirementKey),
    label: String(label),
    targetValue: Number(targetValue),
    currentValue: Number(currentValue),
    unit: String(unit),
    status: Number(currentValue) >= Number(targetValue) ? "met" : "pending",
    description: "浏览器预览规则，可在论文要求页面继续完善。",
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
};

export const useRequirementStore=create<RequirementStore>((set)=>({projectId:null,requirements:[],load:async(projectId)=>{if(typeof window!=="undefined"&&!("__TAURI_INTERNALS__" in window)){set({projectId,requirements:browserRequirements(projectId)});return;}set({projectId,requirements:await requirementService.list(projectId)});}}));
