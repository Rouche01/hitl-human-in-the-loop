import { createClient, RedisClientType } from "redis";
import { appConfig } from "../../config";

const redisClient: RedisClientType = createClient({
  password: appConfig.redis.password,
  socket: {
    host: appConfig.redis.host,
    port: (appConfig.redis.port as number) || 6379,
  },
}) as RedisClientType;

export default redisClient;
