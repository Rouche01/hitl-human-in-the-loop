import { Socket } from "socket.io";
import { INTEGRATION_TYPE, SOCKET_EVENTS } from "../../../constants";
import { addJobToChildProcess, childProcessManager } from "../../child-process-service";
import PROCESS_MESSAGE_TYPE from "../../../constants/process-message-type";

const {
  NW_INTEGRATION_JOIN,
  NW_INTEGRATION_AUTH,
  NW_INTEGRATION_AUTH_OTP_RES,
  NW_INTEGRATION_SELECT_AUDIENCE,
  NW_INTEGRATION_FETCH_AUDIENCE_LIST,
  NW_INTEGRATION_AUTH_LINK_REQ,
  NW_INTEGRATION_TERMINATE_PROCESS,
} = SOCKET_EVENTS;

const {
  AUTH,
  AUDIENCE_FETCH_INIT,
  SELECT_AUDIENCE,
  AUTH_LINK_RECEIVED,
  AUTH_OTP_RECEIVED,
} = PROCESS_MESSAGE_TYPE;

const onJoinConnection = (socket: Socket) => {
  // for logging established socket connections
  console.log(`Socket connection established with socket ${socket.id}`);
};

const onAuthInit = (socket: Socket, data: any) => {
  const userId = (socket as any).user?.sub;
  console.log(
    `${NW_INTEGRATION_AUTH} socket event received from user id: ${userId}`
  );

  const { inputData, ...rest } = data;

  addJobToChildProcess({
    identifier: userId,
    socketId: socket.id,
    payload: {
      ...rest,
      inputData: { ...inputData, userId },
      type: AUTH,
      userId,
      clientSocketId: socket.id,
    },
  });
};

const onAudienceListFetchInitiated = (socket: Socket, data: any) => {
  const userId = (socket as any).user?.sub;
  console.log(
    `${NW_INTEGRATION_FETCH_AUDIENCE_LIST} socket event received from user id: ${userId}`
  );

  addJobToChildProcess({
    identifier: userId,
    socketId: socket.id,
    payload: {
      ...data,
      type: AUDIENCE_FETCH_INIT,
      clientSocketId: socket.id,
      userId,
    },
  });
};

const onAudienceSelected = (socket: Socket, data: any) => {
  const userId = (socket as any).user?.sub;
  console.log(
    `${NW_INTEGRATION_SELECT_AUDIENCE} socket event received from user id: ${userId}`
  );

  addJobToChildProcess({
    identifier: userId,
    socketId: socket.id,
    payload: {
      clientSocketId: socket.id,
      type: SELECT_AUDIENCE,
      userId,
      newsletterIntegrationType: data.integrationType,
      inputData: data.inputData,
      accountIdentifier: data.accountIdentifier,
    },
  });
};

const onTerminateProcess = (socket: Socket) => {
  const userId = (socket as any).user?.sub;
  console.log(
    `${NW_INTEGRATION_TERMINATE_PROCESS} socket event received from user id: ${userId}`
  );

  childProcessManager.killChild(userId);
};

// mailchimp integration event
const onAuthOtpReceived = (socket: Socket, data: any) => {
  const userId = (socket as any).user?.sub;
  console.log(
    `${NW_INTEGRATION_AUTH_OTP_RES} socket event received from user id: ${userId}`
  );

  addJobToChildProcess({
    identifier: userId,
    socketId: socket.id,
    payload: {
      clientSocketId: socket.id,
      type: AUTH_OTP_RECEIVED,
      userId,
      newsletterIntegrationType: data.newsletterIntegrationType,
      inputData: { ...data.inputData, userId },
      accountIdentifier: data.accountIdentifier,
    },
  });
};

// substack integration event
const onAuthLinkReceived = (socket: Socket, data: any) => {
  const userId = (socket as any).user?.sub;
  console.log(
    `${NW_INTEGRATION_AUTH_LINK_REQ} socket event received from user id: ${userId}`
  );

  addJobToChildProcess({
    identifier: userId,
    socketId: socket.id,
    payload: {
      clientSocketId: socket.id,
      type: AUTH_LINK_RECEIVED,
      userId,
      newsletterIntegrationType: data.newsletterIntegrationType,
      inputData: {
        ...data.inputData,
        userId,
      },
      accountIdentifier: data.accountIdentifier,
    },
  });
};

export default {
  [NW_INTEGRATION_JOIN]: onJoinConnection,
  [NW_INTEGRATION_AUTH]: onAuthInit,
  [NW_INTEGRATION_AUTH_OTP_RES]: onAuthOtpReceived,
  [NW_INTEGRATION_SELECT_AUDIENCE]: onAudienceSelected,
  [NW_INTEGRATION_FETCH_AUDIENCE_LIST]: onAudienceListFetchInitiated,
  [NW_INTEGRATION_AUTH_LINK_REQ]: onAuthLinkReceived,
  [NW_INTEGRATION_TERMINATE_PROCESS]: onTerminateProcess,
};
