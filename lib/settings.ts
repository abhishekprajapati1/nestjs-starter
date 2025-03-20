import * as dotenv from 'dotenv';

dotenv.config();

type AppSettingsType = {
  DEV_ENVIRONMENT: boolean;
  PORT: number;
  SECRET_KEY: string;
  DATABASE_URL: string;
  AWS_REGION: string;
  AWS_ACCESS_KEY: string;
  AWS_SECRET_KEY: string;
  AWS_BUCKET_NAME: string;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_EMAIL: string;
  SMTP_PASSWORD: string;
  SMTP_SECURE_FLAG: boolean;
};

const keys = [
  'DEV_ENVIRONMENT',
  'PORT',
  'SECRET_KEY',
  'DATABASE_URL',
  'AWS_REGION',
  'AWS_ACCESS_KEY',
  'AWS_SECRET_KEY',
  'AWS_BUCKET_NAME',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_EMAIL',
  'SMTP_PASSWORD',
  'SMTP_SECURE_FLAG',
];
export type DatabaseIdType = number;
type SettingKey = keyof AppSettingsType;

class AppSettings {
  private readonly settings: AppSettingsType;
  constructor() {
    this.settings = keys.reduce((acc, key) => {
      if (process.env[key] === undefined) {
        throw new Error(`Missing environment variable: ${key}`);
      }
      acc[key] = process.env[key];
      return acc;
    }, {} as AppSettingsType);
  }

  get<T>(key: SettingKey): T {
    return this.settings[key] as T;
  }
}
export const settings = new AppSettings();
