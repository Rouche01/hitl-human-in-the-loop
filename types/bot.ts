import { Namespace } from "socket.io";
import { PuppeteerBot } from "../classes/puppeteer-bot";

/**
 * Represents the options for initializing a puppeteer bot
 */
export interface InitializeBotOpts {
  /** The user's id. */
  userId: string;
}

/**
 * Represents the options for starting an automated flow with puppeteer bot
 */
export interface FlowOptions {
  /** The client socket connection id. */
  clientSocketId: string;
  /** The user's id. */
  userId: string;
  /** The type of newsletter integration */
  integrationType: string;
  /** The name of the particular flow to initialize */
  flowName: string;
  /** User input data */
  inputData?: any;
  /** An instance of socket connection */
  socketConn: Namespace;
  /** An instance of initialized puppeteer bot */
  puppeteerBot: PuppeteerBot;
  /** Account id of authed account */
  accountIdentifier?: string;
  /** Determines whether to kill bot after flow */
  botPolicy?: "keepAlive" | "kill";
}

/**
 * Represents the options for starting an automated stage in a flow
 */
export interface StageOptions {
  /** The client socket connection id. */
  clientSocketId: string;
  /** The name of the stage to be initiated */
  currentStage: string;
  /** Stage config mapped to their name */
  stages: Record<string, MappedStage>;
  /** User input */
  input?: any;
  /** An instance of socket connection */
  socketConn: Namespace;
  /** Account id of authed account */
  accountIdentifier?: string;
  /** An instance of initialized puppeteer bot */
  puppeteerBot: PuppeteerBot;
}

/**
 * Represents a mapped stage in a flow
 */
export interface MappedStage {
  /** The stage name. */
  name: string;
  /** Function to get stage configuration */
  getConfig: (stageType: "initial" | "intermediate" | "final" | string, helpers: any) => any;
}
