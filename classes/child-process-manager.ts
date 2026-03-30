import { fork, ChildProcess } from "child_process";
import { Namespace } from "socket.io";
import { emitToClient } from "../services/socket-service/utils";
import { SOCKET_EVENTS } from "../constants";

/**
 * Represents ChildProcessManager options.
 */
export interface ChildProcessManagerOptions {
  /** The child process file. */
  processFile: string;
  /** Message handler for child processes mapped to message type */
  childrenMessageHandlers?: Record<string, (message: any) => void> | null;
}

/**
 * Represents the value of childProcess map.
 */
export interface ChildProcessMapValue {
  /** The child process */
  childProcess: ChildProcess;
  /** The related client socket id */
  clientSocketId: string;
}

/**
 * ChildProcessManager for managing child processes.
 */
class ChildProcessManager {
  private processFile: string;
  private _childrenMessageHandlers: Record<string, (message: any) => void> | null | undefined;
  private _socketConn: Namespace | null = null;
  private _childProcesses: Map<string, ChildProcessMapValue> = new Map();

  /**
   * Creates a new instance of `ChildProcessManager`.
   *
   * @constructor
   * @param {ChildProcessManagerOptions} options - The options for configuring the `ChildProcessManager`.
   */
  constructor({ processFile, childrenMessageHandlers }: ChildProcessManagerOptions) {
    this.processFile = processFile;
    this._childrenMessageHandlers = childrenMessageHandlers;
  }

  /**
   * Creates a new child process and adds it to the list of child processes.
   *
   * @method
   * @param {string} identifier - Required to identify created child process
   * @param {string} clientSocketId - The related client socket id
   * @param {string[]} [argumentToChild] - Arguments to create child process
   * @returns {ChildProcess} A new child process
   */
  createChildProcess(identifier: string, clientSocketId: string, argumentToChild?: string[]): ChildProcess {
    const argumentToChildResolved = argumentToChild
      ? [identifier, clientSocketId, ...argumentToChild]
      : [identifier, clientSocketId];

    const child = fork(this.processFile, argumentToChildResolved);
    this._addChildProcess(identifier, child, clientSocketId);

    console.log(
      `[${child.pid}]: child process created for user with id: ${identifier}`
    );

    child.on("message", (message: any) => {
      console.log(
        `Processing message from child process ${identifier}:`,
        message?.type
      );
      if (this._childrenMessageHandlers && message?.type) {
        const handler = this._childrenMessageHandlers[message.type];
        return handler?.(message);
      }
    });

    child.on("error", (error: Error) => {
      console.error(`Error in child process ${identifier}:`, error);
    });

    child.on("close", (code: number | null, signal: NodeJS.Signals | null) => {
      console.log(
        `Child process ${identifier} closed with code ${code} and signal ${signal}`
      );
    });

    child.on("exit", (code: number | null, signal: NodeJS.Signals | null) => {
      if (code !== 0 && code !== null) {
        const clientSocketId = this._getChildProcessClientSocketId(identifier);
        if (this._socketConn && clientSocketId) {
          emitToClient({
            clientSocketId,
            data: { message: "Something went wrong, please try again" },
            event: SOCKET_EVENTS.NW_INTEGRATION_GENERIC_ERROR,
            socket: this._socketConn,
          });
        }
      }
      console.log(
        `Child process ${identifier} exited with code ${code} and signal ${signal}`
      );
      this._removeChildProcess(identifier);
    });

    return child;
  }

  /**
   * Checks if child process with identifier exists
   *
   * @param {string} identifier - Unique identifier for child process
   * @returns {boolean}
   */
  isChildProcessAlive(identifier: string): boolean {
    const child = this._getChildProcess(identifier);

    if (!child) {
      return false;
    }

    return child.connected;
  }

  /**
   * Sends a message payload to a child process.
   *
   * @method
   * @param {string} identifier - Required to identify created child process
   * @param {any} message - Message payload
   */
  sendMessageToChild(identifier: string, message: any): void {
    const child = this._getChildProcess(identifier);

    if (!child) {
      console.error(`Child process with identifier ${identifier} not found.`);
      throw new Error("Child process does not exist");
    }

    child.send(message);
  }

  /**
   * Sets up the socket connection namespace.
   *
   * @method
   * @param {Namespace} socketConn - Socket connection namespace
   */
  setupSocketConn(socketConn: Namespace): void {
    this._socketConn = socketConn;
  }

  /**
   * Kills a child process.
   *
   * @method
   * @param {string} identifier - Identifies a child process
   */
  killChild(identifier: string): void {
    const child = this._getChildProcess(identifier);

    if (!child) {
      console.error(`Child process with identifier ${identifier} not found.`);
      return;
    }

    child.kill("SIGTERM");
  }

  /**
   * Gets a child process with the identifier.
   */
  private _getChildProcess(identifier: string): ChildProcess | undefined {
    return this._childProcesses.get(identifier)?.childProcess;
  }

  /**
   * Gets the client socket id related to a child process.
   */
  private _getChildProcessClientSocketId(identifier: string): string | undefined {
    return this._childProcesses.get(identifier)?.clientSocketId;
  }

  /**
   * Adds child process to on memory map.
   */
  private _addChildProcess(identifier: string, childProcess: ChildProcess, clientSocketId: string): void {
    this._childProcesses.set(identifier, { childProcess, clientSocketId });
  }

  /**
   * Removes child process from on memory map.
   */
  private _removeChildProcess(identifier: string): void {
    this._childProcesses.delete(identifier);
  }
}

/**
 * Creates an instance of child process manager.
 */
const createChildProcessManager = (processFilePath: string): ChildProcessManager => {
  return new ChildProcessManager({
    processFile: processFilePath,
  });
};

export { createChildProcessManager, ChildProcessManager };
