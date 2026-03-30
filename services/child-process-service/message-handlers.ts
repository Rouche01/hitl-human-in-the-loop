import { startFlow } from "../bot-service/utils";
import PROCESS_MESSAGE_TYPE from "../../constants/process-message-type";
import { INTEGRATION_FLOW } from "../../constants";
import {
  AuthMessagePayload,
  AudienceFetchInitMessagePayload,
  SelectAudienceMessagePayload,
  AuthLinkMessagePayload,
  AuthOtpMessagePayload,
} from "./types";

const {
  AUTH,
  AUDIENCE_FETCH_INIT,
  SELECT_AUDIENCE,
  AUTH_LINK_RECEIVED,
  AUTH_OTP_RECEIVED,
} = PROCESS_MESSAGE_TYPE;

/**
 * Handler for `AUTH` message type
 */
const onAuth = async (message: AuthMessagePayload): Promise<void> => {
  const {
    accountIdentifier,
    newsletterIntegrationType,
    clientSocketId,
    userId,
    inputData,
    socketConn,
    bot,
  } = message;

  await startFlow({
    clientSocketId,
    flowName: (INTEGRATION_FLOW as any)[newsletterIntegrationType].LOGIN,
    integrationType: newsletterIntegrationType,
    inputData,
    socketConn,
    puppeteerBot: bot,
    botPolicy: "keepAlive",
    userId,
    accountIdentifier,
  });
};

/**
 * Handler for `AUDIENCE_FETCH_INIT` message type
 */
const onAudienceFetchInit = async (message: AudienceFetchInitMessagePayload): Promise<void> => {
  const {
    clientSocketId,
    newsletterIntegrationType,
    socketConn,
    bot,
    userId,
    accountIdentifier,
  } = message;

  await startFlow({
    flowName: (INTEGRATION_FLOW as any)[newsletterIntegrationType].SELECT_LIST,
    integrationType: newsletterIntegrationType,
    socketConn,
    puppeteerBot: bot,
    botPolicy: "keepAlive",
    clientSocketId,
    userId,
    accountIdentifier,
    // inputData is optional in FlowOptions, so it's okay if not provided here
  });
};

/**
 * Handler for `SELECT_AUDIENCE` message type
 */
const onAudienceSelect = async (message: SelectAudienceMessagePayload): Promise<void> => {
  const {
    clientSocketId,
    inputData,
    newsletterIntegrationType,
    socketConn,
    bot,
    userId,
    accountIdentifier,
  } = message;

  await startFlow({
    flowName: (INTEGRATION_FLOW as any)[newsletterIntegrationType].EXTRACT_DATA,
    integrationType: newsletterIntegrationType,
    socketConn,
    puppeteerBot: bot,
    inputData,
    botPolicy: "kill",
    clientSocketId,
    userId,
    accountIdentifier,
  });

  process.exit(0);
};

/**
 * Handler for `AUTH_LINK_RECEIVED` message type
 */
const onAuthLinkReceived = async (message: AuthLinkMessagePayload): Promise<void> => {
  const {
    clientSocketId,
    inputData,
    newsletterIntegrationType,
    socketConn,
    bot,
    userId,
    accountIdentifier,
  } = message;

  await startFlow({
    flowName: (INTEGRATION_FLOW as any)[newsletterIntegrationType].AUTH_LINK,
    integrationType: newsletterIntegrationType,
    socketConn,
    puppeteerBot: bot,
    inputData,
    botPolicy: "keepAlive",
    clientSocketId,
    userId,
    accountIdentifier,
  });
};

/**
 * Handler for `AUTH_OTP_RECEIVED` message type
 */
const onAuthOtpReceived = async (message: AuthOtpMessagePayload): Promise<void> => {
  const {
    clientSocketId,
    inputData,
    newsletterIntegrationType,
    socketConn,
    userId,
    bot,
    accountIdentifier,
  } = message;

  await startFlow({
    flowName: (INTEGRATION_FLOW as any)[newsletterIntegrationType].TOTP,
    integrationType: newsletterIntegrationType,
    socketConn,
    puppeteerBot: bot,
    inputData,
    botPolicy: "keepAlive",
    clientSocketId,
    userId,
    accountIdentifier,
  });
};

const messageHandlers: Record<string, Function> = {
  [AUTH]: onAuth,
  [AUDIENCE_FETCH_INIT]: onAudienceFetchInit,
  [SELECT_AUDIENCE]: onAudienceSelect,
  [AUTH_LINK_RECEIVED]: onAuthLinkReceived,
  [AUTH_OTP_RECEIVED]: onAuthOtpReceived,
};

export default messageHandlers;
