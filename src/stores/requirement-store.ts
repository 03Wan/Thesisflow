import { create } from "zustand";
import { requirementService } from "@/services/requirementService";
import type { ThesisRequirement } from "@/types/domain";
type RequirementChanges = Partial<Omit<ThesisRequirement, "id" | "projectId" | "createdAt">>;
type RequirementStore={projectId:string|null;requirements:ThesisRequirement[];load:(projectId:string)=>Promise<void>;update:(id:string,changes:RequirementChanges)=>Promise<ThesisRequirement>};

const browserStorageKey = (projectId: string) => `thesisflow:${projectId}:requirements`;

const browserRequirements = (projectId: string): ThesisRequirement[] => {
  try {
    return JSON.parse(localStorage.getItem(browserStorageKey(projectId)) ?? "[]") as ThesisRequirement[];
  } catch { return []; }
};

export const useRequirementStore=create<RequirementStore>((set,get)=>({
  projectId:null,
  requirements:[],
  load:async(projectId)=>{if(typeof window!=="undefined"&&!("__TAURI_INTERNALS__" in window)){set({projectId,requirements:browserRequirements(projectId)});return;}set({projectId,requirements:await requirementService.list(projectId)});},
  update:async(id,changes)=>{
    const browserPreview=typeof window!=="undefined"&&!("__TAURI_INTERNALS__" in window);
    if(browserPreview){
      const existing=get().requirements.find((item)=>item.id===id);
      if(!existing) throw new Error("未找到论文要求。");
      const updated={...existing,...changes,updatedAt:new Date().toISOString()};
      const requirements=get().requirements.map((item)=>item.id===id?updated:item);
      if(get().projectId) localStorage.setItem(browserStorageKey(get().projectId!),JSON.stringify(requirements));
      set({requirements});
      return updated;
    }
    const updated=await requirementService.update(id,changes);
    set((state)=>({requirements:state.requirements.map((item)=>item.id===id?updated:item)}));
    return updated;
  },
}));
