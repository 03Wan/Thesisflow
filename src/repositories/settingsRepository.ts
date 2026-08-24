import { getDatabase } from "@/lib/database";
import type { AppSetting } from "@/types/domain";
export class SettingsRepository {
  async find(key:string):Promise<AppSetting|null>{const db=await getDatabase();const rows=await db.select<AppSetting[]>("SELECT key,value,value_type AS valueType,updated_at AS updatedAt FROM app_settings WHERE key=?",[key]);return rows[0]??null;}
  async list():Promise<AppSetting[]>{const db=await getDatabase();return db.select<AppSetting[]>("SELECT key,value,value_type AS valueType,updated_at AS updatedAt FROM app_settings ORDER BY key");}
  async upsert(setting:AppSetting):Promise<AppSetting>{const db=await getDatabase();await db.execute("INSERT INTO app_settings (key,value,value_type,updated_at) VALUES (?,?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,value_type=excluded.value_type,updated_at=excluded.updated_at",[setting.key,setting.value,setting.valueType,setting.updatedAt]);return setting;}
  async delete(key:string):Promise<void>{const db=await getDatabase();await db.execute("DELETE FROM app_settings WHERE key=?",[key]);}
}
