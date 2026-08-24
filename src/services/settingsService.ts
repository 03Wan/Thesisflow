import { AppError, toAppError } from "@/lib/app-error";
import { SettingsRepository } from "@/repositories/settingsRepository";
import type { AppSetting, SettingValueType } from "@/types/domain";
const now=()=>new Date().toISOString();
export class SettingsService {
  constructor(private readonly repository=new SettingsRepository()){}
  async list(){try{return await this.repository.list();}catch(error){throw toAppError(error,"无法加载应用设置。");}}
  async get(key:string){try{return await this.repository.find(key);}catch(error){throw toAppError(error,"无法读取应用设置。");}}
  async set(key:string,value:string,valueType:SettingValueType="string"):Promise<AppSetting>{if(!key.trim())throw new AppError("validation","设置键不能为空。");try{return await this.repository.upsert({key:key.trim(),value,valueType,updatedAt:now()});}catch(error){throw toAppError(error,"无法保存应用设置。");}}
  async remove(key:string){try{await this.repository.delete(key);}catch(error){throw toAppError(error,"无法删除应用设置。");}}
}
export const settingsService=new SettingsService();
