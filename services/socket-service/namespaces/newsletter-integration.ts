import { auth } from "../../firebase-service";
import redisClient from "../../redis-service";
import { INTEGRATION_TYPE, SOCKET_EVENTS, SOCKET_CHANNELS } from "../../../constants";
import eventHandlers from "../event-handlers/newsletter-integration.handlers";
import { emitToClient } from "../utils";
import SocketService from "../../socket-service";
import { childProcessManager } from "../../child-process-service";
import { Namespace, Socket } from "socket.io";

const { NEWSLETTER_INTEGRATION_NAMESPACE } = SOCKET_CHANNELS;
const {
  NW_INTEGRATION_CONNECTION_ERR,
  NW_INTEGRATION_JOIN,
  NW_INTEGRATION_INSTANCE_STATUS,
} = SOCKET_EVENTS;

/**
 * A function that emits socket event to connected client
 */
const initNewsletterIntegrationSocketChannel = (): void => {
  const nwIntegrationNamespace: Namespace = SocketService.useNamespaceConnection(
    NEWSLETTER_INTEGRATION_NAMESPACE
  );

  childProcessManager.setupSocketConn(nwIntegrationNamespace);

  nwIntegrationNamespace.on("connection", (socket: Socket) => {
    socket.use(async (packet: any[], next: (err?: Error) => void) => {
      const token = (socket.handshake?.auth?.token as string | undefined)?.replace("Bearer ", "");
      const query = socket.handshake.query;

      if (!token) {
        const error = new Error("not authorized");
        error.data = { content: "Please retry with auth token" };
        return next(error);
      }

      try {
        const user = await auth.verifyIdToken(token);
        (socket as any).user = user;

        // check that event type emitted is join
        if (packet[0] === NW_INTEGRATION_JOIN) {
          const canConnect = await (redisClient as any).set(
            `users:${user.uid || user.sub}`,
            socket.id,
            {
              NX: true,
              EX: 30,
            }
          );

          if (!canConnect) {
            emitToClient({
              socket,
              event: NW_INTEGRATION_INSTANCE_STATUS,
              data: { active: true },
            });
          } else {
            emitToClient({
              socket,
              event: NW_INTEGRATION_INSTANCE_STATUS,
              data: { active: false, query },
            });
          }
        }

        return next();
      } catch (err: any) {
        console.log(err);
        const error = new Error("not authorized");
        error.data = { content: "Please retry with auth token" };
        return next(error);
      }
    });

    Object.entries(eventHandlers).forEach(([event, handler]) => {
      socket.once(event, (data: any) => (handler as any)(socket, data));
    });

    socket.conn.on("packet", async ({ type }: any) => {
      if (type === "pong" && (socket as any).user) {
        const user = (socket as any).user;
        await (redisClient as any).set(`users:${user.uid || user.sub}`, socket.id, {
          XX: true,
          EX: 30,
        });
      }
    });

    socket.on("error", (error: any) => {
      console.log(error, "handling socket error");
      emitToClient({
        socket,
        event: NW_INTEGRATION_CONNECTION_ERR,
        data: {
          message: `${error.message}. ${error.data?.content || ""}`,
        },
      });
    });

    socket.on("disconnect", async () => {
      console.log(`Socket ${socket.id} disconnected.`);
      if ((socket as any).user) {
        const user = (socket as any).user;
        const activeSocketForUser = await (redisClient as any).get(
          `users:${user.uid || user.sub}`
        );
        if (activeSocketForUser === socket.id) {
          await (redisClient as any).del(`users:${user.uid || user.sub}`);
        }
      }
    });
  });
};

export { initNewsletterIntegrationSocketChannel };
