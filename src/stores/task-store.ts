import { create } from "zustand";
import { toAppError, type AppError } from "@/lib/app-error";
import { taskService } from "@/services/taskService";
import type { Task } from "@/types/domain";
type TaskStore = { projectId: string | null; tasks: Task[]; isLoading: boolean; error: AppError | null; load: (projectId: string) => Promise<void>; create: (task: Task) => Promise<Task>; update: (id: string, changes: Partial<Omit<Task,"id"|"projectId"|"createdAt">>) => Promise<void>; remove: (id: string) => Promise<void>; };
export const useTaskStore = create<TaskStore>((set) => ({ projectId: null, tasks: [], isLoading: false, error: null,
  load: async (projectId) => { set({isLoading:true,error:null}); try { set({ projectId, tasks: await taskService.list(projectId), error: null,isLoading:false }); } catch (error) { set({ error: toAppError(error,"无法加载任务。"),isLoading:false} ); } },
  create: async (task) => { set({isLoading:true,error:null}); try { const created=await taskService.create(task); set((state)=>({tasks:[created,...state.tasks],error:null,isLoading:false})); return created; } catch(error){const appError=toAppError(error,"无法创建任务。");set({error:appError,isLoading:false});throw appError;} },
  update: async (id,changes) => { set({isLoading:true,error:null}); try { const updated=await taskService.update(id,changes);set((state)=>({tasks:state.tasks.map((task)=>task.id===id?updated:task),error:null,isLoading:false})); }catch(error){const appError=toAppError(error,"无法更新任务。");set({error:appError,isLoading:false});throw appError;} },
  remove: async (id) => { set({isLoading:true,error:null}); try { await taskService.remove(id);set((state)=>({tasks:state.tasks.filter((task)=>task.id!==id),error:null,isLoading:false})); }catch(error){const appError=toAppError(error,"无法删除任务。");set({error:appError,isLoading:false});throw appError;} },
}));
