export type SettingValueType = "string" | "number" | "boolean" | "json";

export type SettingRecord = {
  settingKey: string;
  settingValue: string;
  settingType: SettingValueType;
  isSecure: boolean;
  updatedAt: string;
};

export type SettingsGetInput = {
  key: string;
};

export type SettingsSetInput = {
  key: string;
  value: string;
  type: SettingValueType;
  isSecure?: boolean;
};
