import { create } from "zustand";
import { toAppError, type AppError } from "@/lib/app-error";
import { taskService } from "@/services/taskService";
import type { Task } from "@/types/domain";
type TaskStore = { projectId: string | null; tasks: Task[]; isLoading: boolean; error: AppError | null; load: (projectId: string) => Promise<void>; create: (task: Task) => Promise<Task>; update: (id: string, changes: Partial<Omit<Task,"id"|"projectId"|"createdAt">>) => Promise<void>; remove: (id: string) => Promise<void>; };
const isBrowserPreview = () => typeof window !== "undefined" && !("__TAURI_INTERNALS__" in window);
const browserTasks = (projectId: string): Task[] => {
  const timestamp = new Date().toISOString();
  return [
    { id: `browser-task-${projectId}-1`, projectId, workflowStageId: null, stageKey: "research", title: "完成变量定义与样本口径说明", description: "统一正文、数据表和模型中的变量命名。", sourceType: "manual", sourceReferenceId: null, priority: "high", status: "in_progress", dueAt: "2026-08-28T23:59:59.000Z", completedAt: null, sortOrder: 1, createdAt: timestamp, updatedAt: timestamp },
    { id: `browser-task-${projectId}-2`, projectId, workflowStageId: null, stageKey: "literature", title: "补充资源配置机制文献", description: "补充近五年核心中英文文献。", sourceType: "ai", sourceReferenceId: null, priority: "medium", status: "todo", dueAt: "2026-09-02T23:59:59.000Z", completedAt: null, sortOrder: 2, createdAt: timestamp, updatedAt: timestamp },
    { id: `browser-task-${projectId}-3`, projectId, workflowStageId: null, stageKey: "first_draft", title: "建立结果分析章节提纲", description: "按照基准、稳健性和异质性组织章节。", sourceType: "manual", sourceReferenceId: null, priority: "medium", status: "todo", dueAt: null, completedAt: null, sortOrder: 3, createdAt: timestamp, updatedAt: timestamp },
  ];
};

export const useTaskStore = create<TaskStore>((set) => ({ projectId: null, tasks: [], isLoading: false, error: null,
  load: async (projectId) => { if (isBrowserPreview()) { set({ projectId, tasks: browserTasks(projectId), error: null, isLoading: false }); return; } set({isLoading:true,error:null}); try { set({ projectId, tasks: await taskService.list(projectId), error: null,isLoading:false }); } catch (error) { set({ error: toAppError(error,"无法加载任务。"),isLoading:false} ); } },
  create: async (task) => { if (isBrowserPreview()) { set((state)=>({tasks:[task,...state.tasks],error:null,isLoading:false})); return task; } set({isLoading:true,error:null}); try { const created=await taskService.create(task); set((state)=>({tasks:[created,...state.tasks],error:null,isLoading:false})); return created; } catch(error){const appError=toAppError(error,"无法创建任务。");set({error:appError,isLoading:false});throw appError;} },
  update: async (id,changes) => { if (isBrowserPreview()) { set((state)=>({tasks:state.tasks.map((task)=>task.id===id?{...task,...changes,updatedAt:new Date().toISOString()}:task),error:null,isLoading:false})); return; } set({isLoading:true,error:null}); try { const updated=await taskService.update(id,changes);set((state)=>({tasks:state.tasks.map((task)=>task.id===id?updated:task),error:null,isLoading:false})); }catch(error){const appError=toAppError(error,"无法更新任务。");set({error:appError,isLoading:false});throw appError;} },
  remove: async (id) => { if (isBrowserPreview()) { set((state)=>({tasks:state.tasks.filter((task)=>task.id!==id),error:null,isLoading:false})); return; } set({isLoading:true,error:null}); try { await taskService.remove(id);set((state)=>({tasks:state.tasks.filter((task)=>task.id!==id),error:null,isLoading:false})); }catch(error){const appError=toAppError(error,"无法删除任务。");set({error:appError,isLoading:false});throw appError;} },
}));
