export interface FirebaseAdminConfig {
  privateKey?: string;
  projectId?: string;
  clientEmail?: string;
}

export interface RedisConfig {
  host?: string;
  port?: number;
  password?: string;
}

export interface RecaptchaPluginConfig {
  apiKey?: string;
}

export interface CreatuulsAppConfig {
  apiEndpoint?: string;
  adminApiKey?: string;
  apiKeyHeader?: string;
}

export interface AppConfig {
  firebaseAdmin: FirebaseAdminConfig;
  port?: number;
  baseUrl?: string;
  redis: RedisConfig;
  captcha: RecaptchaPluginConfig;
  queueConcurrency: number;
  creatuulsPlatform: CreatuulsAppConfig;
  dummySocketId?: string;
}
