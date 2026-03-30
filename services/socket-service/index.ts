import { Server as SocketServer, Namespace } from "socket.io";
import { Server as HttpServer } from "http";
import { createAdapter } from "@socket.io/redis-streams-adapter";
import { RedisClientType } from "redis";

/**
 * SocketService: for managing socket server connection.
 */
class SocketService {
  /**
   * The socket server instance.
   */
  static instance: SocketServer | null = null;

  /**
   * Creates a socket server connection instance.
   *
   * @static
   * @param {HttpServer} httpServer - An instance of http server
   * @param {RedisClientType} redisClient - The related client socket id
   * @returns {SocketServer} An instance of connected socket server
   */
  static initialize(httpServer: HttpServer, redisClient: RedisClientType): SocketServer {
    const socketServer = new SocketServer(httpServer, {
      cors: { origin: "*" },
      adapter: createAdapter(redisClient),
    });

    socketServer.on("connection", () => {
      console.log("connected");
    });

    SocketService._setInstance(socketServer);

    return socketServer;
  }

  /**
   * Creates a socket server namespace connection.
   *
   * @static
   * @param {string} namespace - The name identifier for the socket connection namespace
   * @returns {Namespace} An instance of namespace socket server connection
   */
  static useNamespaceConnection(namespace: string): Namespace {
    if (!SocketService.instance) {
      throw new Error("No socket connection available to create namespace!");
    }
    return SocketService.instance.of(namespace);
  }

  static _getInstance(): SocketServer | null {
    return SocketService.instance;
  }

  /**
   * Sets an instance of connected socket server.
   *
   * @static
   * @param {SocketServer} socketServer - An instance of connected socket server
   */
  static _setInstance(socketServer: SocketServer): void {
    SocketService.instance = socketServer;
  }
}

export default SocketService;
