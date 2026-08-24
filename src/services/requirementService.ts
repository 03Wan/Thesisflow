import { AppError, toAppError } from "@/lib/app-error";
import { RequirementRepository } from "@/repositories/requirementRepository";
import type { ThesisRequirement } from "@/types/domain";
const now=()=>new Date().toISOString();
export class RequirementService {
  constructor(private readonly repository=new RequirementRepository()){}
  async list(projectId:string){try{return await this.repository.listByProject(projectId);}catch(error){throw toAppError(error,"无法加载论文要求。");}}
  async create(requirement:ThesisRequirement){try{return await this.repository.create(requirement);}catch(error){throw toAppError(error,"无法创建论文要求。");}}
  async update(id:string,changes:Partial<Omit<ThesisRequirement,"id"|"projectId"|"createdAt">>){const result=await this.repository.update(id,{...changes,updatedAt:now()});if(!result)throw new AppError("not_found","未找到论文要求。");return result;}
  async remove(id:string){try{await this.repository.delete(id);}catch(error){throw toAppError(error,"无法删除论文要求。");}}
}
export const requirementService=new RequirementService();
