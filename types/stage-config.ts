import { PuppeteerBot } from "../classes/puppeteer-bot";
import { Namespace } from "socket.io";

/**
 * Represents the options for the action function in a sequence step.
 */
export interface ActionOptions {
  /** The selectors for elements in the step. */
  selectors: string[];
  /** The data piped from previous steps. */
  pipedData?: any;
  /** The key associated with the action. */
  key?: string;
}

/**
 * A function that performs a specific action for a sequence.
 */
export type ActionFunction = (options: ActionOptions) => Promise<any> | any;

/**
 * Represents a step in the sequence of actions.
 */
export interface SequenceStep {
  /** The selectors for elements in the step. */
  selectors: string[];
  /** The action to perform in the step. */
  action: ActionFunction;
  /** The order of the step in the sequence. */
  order: number;
  /** The key associated with the sequence. */
  key?: string;
}

/**
 * Represents the configuration for a stage in the automation process.
 */
export interface StageConfig {
  /** The URL associated with the stage. */
  url: string;
  /** The type of the stage. */
  stageType: string;
  /** The sequence of actions to perform in the stage. */
  sequence: SequenceStep[];
}

/**
 * Represents the options for getting a stage configuration.
 */
export interface GetStageConfigOptions {
  /** The Puppeteer bot instance. */
  puppeteerBot: PuppeteerBot;
  /** The input data for the stage. */
  inputData?: any;
  /** The socket connection instance. */
  socketConn: Namespace;
  /** The client socket id. */
  clientSocketId: string;
  /** Account id for authed flow. */
  accountIdentifier?: string;
}

/**
 * A function that gets the configuration for a specific stage.
 */
export type GetStageConfigFunction = (
  stageType?: string,
  stageHelpers?: GetStageConfigOptions
) => StageConfig;
