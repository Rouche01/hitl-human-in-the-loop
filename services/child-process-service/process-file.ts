import { Server } from "socket.io";
import redisClient from "../redis-service";
import messageHandlers from "./message-handlers";
import { createAdapter } from "@socket.io/redis-streams-adapter";
import { SOCKET_CHANNELS, SOCKET_EVENTS } from "../../constants";
import { initBot } from "../bot-service";
import { emitToClient } from "../socket-service/utils";
import { RedisClientType } from "redis";

const argumentsFromParent = process.argv.slice(2);

/**
 * Runs the procedure for the child process.
 *
 * @param {string} userId - User's id
 * @param {string} userSocketId - User's socket connection id
 */
async function main(userId: string, userSocketId: string): Promise<void> {
  await (redisClient as RedisClientType).connect();
  
  const processSocketConnection = new Server({
    adapter: createAdapter(redisClient as RedisClientType),
  }).of(SOCKET_CHANNELS.NEWSLETTER_INTEGRATION_NAMESPACE);

  const bot = await initBot({ userId });

  process.on("message", async (message: any) => {
    if (!message || !message.type) {
      console.warn("Received malformed message from parent:", message);
      return;
    }

    console.log(
      `[${process.pid}]: processing ${message.type} for user with id: ${userId}`
    );

    const handler = (messageHandlers as Record<string, Function>)[message.type];
    if (handler) {
      try {
        await handler({
          ...message,
          socketConn: processSocketConnection,
          bot,
        });
      } catch (err: any) {
        console.error(`Error handling message ${message.type}:`, err.message);
      }
    } else {
      console.error(`No handler found for message type: ${message.type}`);
    }
  });

  process.on("uncaughtException", async (error: Error) => {
    await bot.deInit();
    console.error("Uncaught Exception in child process:", error);
    process.exit(1);
  });

  process.on("unhandledRejection", async (reason: any, promise: Promise<any>) => {
    await bot.deInit();
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    process.exit(1);
  });

  process.on("exit", async (code: number) => {
    await bot.deInit();
    console.log(`[${process.pid}]: process exited with code ${code}`);
  });

  process.on("SIGTERM", async () => {
    emitToClient({
      socket: processSocketConnection,
      clientSocketId: userSocketId,
      event: SOCKET_EVENTS.NW_INTEGRATION_PROCESS_TERMINATED,
      data: { message: "Account linking terminated!" },
    });
    await bot.deInit();
    process.exit();
  });
}

if (argumentsFromParent[0] && argumentsFromParent[1]) {
  main(argumentsFromParent[0], argumentsFromParent[1]);
} else {
  console.error("Missing required arguments for child process.");
  process.exit(1);
}
