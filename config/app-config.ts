import { AppConfig } from "../types/configs";
import "dotenv/config";

/**
 * App configuration object.
 */
const appConfig: AppConfig = {
  firebaseAdmin: {
    privateKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  },
  port: Number(process.env.PORT),
  baseUrl: process.env.BASE_URL,
  redis: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
  },
  captcha: {
    apiKey: process.env.CAPTCHA_API_KEY,
  },
  queueConcurrency: Number(process.env.QUEUE_CONCURRENCY) || 1,
  creatuulsPlatform: {
    apiEndpoint: process.env.CREATUULS_PLATFORM_API,
    adminApiKey: process.env.CREATUULS_PLATFORM_ADMIN_API_KEY,
    apiKeyHeader: process.env.CREATUULS_PLATFORM_API_KEY_HEADER,
  },
  dummySocketId: process.env.DUMMY_SOCKET_ID,
};

export default appConfig;

