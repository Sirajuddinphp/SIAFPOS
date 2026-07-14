import type Database from "better-sqlite3";
import type { SettingRecord, SettingValueType } from "../../shared/contracts/settings-contracts";

type SettingRow = {
  setting_key: string;
  setting_value: string;
  setting_type: SettingValueType;
  is_secure: 0 | 1;
  updated_at: string;
};

export class SettingsRepository {
  constructor(private readonly db: Database.Database) {}

  get(key: string): SettingRecord | null {
    const row = this.db.prepare("SELECT * FROM app_settings WHERE setting_key = ?").get(key) as SettingRow | undefined;
    return row ? mapSetting(row) : null;
  }

  set(key: string, value: string, type: SettingValueType, isSecure: boolean, now: string): SettingRecord {
    this.db
      .prepare(
        `INSERT INTO app_settings (setting_key, setting_value, setting_type, is_secure, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(setting_key) DO UPDATE SET
           setting_value = excluded.setting_value,
           setting_type = excluded.setting_type,
           is_secure = excluded.is_secure,
           updated_at = excluded.updated_at`
      )
      .run(key, value, type, isSecure ? 1 : 0, now);

    const record = this.get(key);
    if (!record) {
      throw new Error("Setting write failed.");
    }
    return record;
  }
}

function mapSetting(row: SettingRow): SettingRecord {
  return {
    settingKey: row.setting_key,
    settingValue: row.is_secure ? "" : row.setting_value,
    settingType: row.setting_type,
    isSecure: row.is_secure === 1,
    updatedAt: row.updated_at
  };
}
