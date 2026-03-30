import { Namespace, Socket } from "socket.io";

/**
 * Represents the options for emitToClientFn
 */
export interface EmitToClientOptions {
  /** An instance of connected socket server or sender. */
  socket: Namespace | Socket;
  /** The client socket connection id. */
  clientSocketId?: string;
  /** The socket event */
  event: string;
  /** The socket event payload */
  data: any;
}

/**
 * A function that emits socket event to connected client
 *
 * @param {EmitToClientOptions} options - The options to emit to a socket client.
 */
const emitToClient = ({ socket, clientSocketId, event, data }: EmitToClientOptions): void => {
  if (socket instanceof Namespace) {
    if (!clientSocketId) {
      // In some cases, we might want to broadcast to the whole namespace, 
      // but the original code expected a clientSocketId.
      // Making it optional in the interface but checking it here.
      throw new Error("Socket id is not defined for namespace emission");
    }
    socket.to(clientSocketId).emit(event, data);
  } else {
    // Treat as Socket or similar that has .emit
    (socket as Socket).emit(event, data);
  }
};

export { emitToClient };
