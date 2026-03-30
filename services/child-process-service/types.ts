import { Namespace } from "socket.io";
import { PuppeteerBot } from "../../classes/puppeteer-bot";

/**
 * Payload properties for messages from parent to child process.
 */
export interface ParentToChildPayload {
  /** Message type. */
  type: string;
  /** User id mapping for the task */
  userId: string;
  /** Target client socket id for real-time updates */
  clientSocketId: string;
  /** Unique account identifier for the session */
  accountIdentifier?: string;
  /** Specific input data for the task */
  inputData?: any;
  /** Additional dynamic properties */
  [key: string]: any;
}

/**
 * Common payload properties for messages after augmentation in child process.
 */
export interface MessagePayload extends ParentToChildPayload {
  /** Associated bot instance */
  bot: PuppeteerBot;
  /** Socket connection namespace */
  socketConn: Namespace;
}

/**
 * Payload for authentication tasks.
 */
export interface AuthMessagePayload extends MessagePayload {
  email?: string;
  username?: string;
  password?: string;
  usePassword?: boolean;
  newsletterIntegrationType: string;
}

/**
 * Payload for initializing audience list fetch.
 */
export interface AudienceFetchInitMessagePayload extends MessagePayload {
  newsletterIntegrationType: string;
}

/**
 * Mailchimp specific input data for selecting an audience.
 */
export interface MailchimpSelectAudienceInputData {
  audienceId: string;
  audienceName: string;
  publisherChannelId?: string;
}

/**
 * Substack specific input data for selecting a publication.
 */
export interface SubstackSelectAudienceInputData {
  publicationLink: string;
  publisherChannelId?: string;
}

/**
 * Payload for selecting an audience/publication.
 */
export interface SelectAudienceMessagePayload extends MessagePayload {
  newsletterIntegrationType: string;
  inputData: MailchimpSelectAudienceInputData | SubstackSelectAudienceInputData;
}

/**
 * Input data for auth link verification.
 */
export interface AuthLinkInputData {
  userId: string;
  authLink: string;
}

/**
 * Payload for link-based authentication.
 */
export interface AuthLinkMessagePayload extends MessagePayload {
  newsletterIntegrationType: string;
  inputData: AuthLinkInputData;
}

/**
 * Input data for OTP verification.
 */
export interface AuthOtpInputData {
  userId: string;
  otp: string;
}

/**
 * Payload for OTP verification tasks.
 */
export interface AuthOtpMessagePayload extends MessagePayload {
  newsletterIntegrationType: string;
  inputData: AuthOtpInputData;
}
