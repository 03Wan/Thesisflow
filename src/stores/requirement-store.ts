import { create } from "zustand";
import { requirementService } from "@/services/requirementService";
import type { ThesisRequirement } from "@/types/domain";
type RequirementStore={projectId:string|null;requirements:ThesisRequirement[];load:(projectId:string)=>Promise<void>};
export const useRequirementStore=create<RequirementStore>((set)=>({projectId:null,requirements:[],load:async(projectId)=>set({projectId,requirements:await requirementService.list(projectId)})}));
