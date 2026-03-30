import { ParentToChildPayload } from "../../services/child-process-service/types";

/**
 * Represents RunBotArgs
 */
export interface RunBotArgs {
  /** User's id */
  userId: string;
  /** Child process payload from parent */
  messagePayload: ParentToChildPayload;
}
