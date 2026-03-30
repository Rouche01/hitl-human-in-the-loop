import path from "path";
import { createChildProcessManager, ChildProcessManager } from "../../classes/child-process-manager";

// TypeScript will resolve this normally if the file exists as .ts
const processFilePath = path.join(__dirname, "./process-file");

const childProcessManager: ChildProcessManager = createChildProcessManager(processFilePath);

/**
 * Represents option param for setting up child process
 */
export interface SetupChildProcessOpts {
  /** Unique identifier for child process */
  identifier: string;
  /** Socket id related to child process */
  socketId: string;
  /** Message payload to be processed by child process */
  payload: any;
}

/**
 * Sets up a child process if unalive and sends message payload
 *
 * @param {SetupChildProcessOpts} options - Unique identifier for child process
 */
const addJobToChildProcess = ({ identifier, socketId, payload }: SetupChildProcessOpts): void => {
  const isAlive = childProcessManager.isChildProcessAlive(identifier);

  if (!isAlive) {
    console.log("Creating a new child process for client");
    childProcessManager.createChildProcess(identifier, socketId);
    childProcessManager.sendMessageToChild(identifier, payload);
  } else {
    console.log("Child process exist for this client");
    childProcessManager.sendMessageToChild(identifier, payload);
  }
};

export { childProcessManager, addJobToChildProcess };
