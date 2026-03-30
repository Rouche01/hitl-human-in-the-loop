"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// app.ts
var import_express4 = __toESM(require("express"));
var import_http = require("http");

// classes/error.ts
var CustomError = class _CustomError extends Error {
  statusCode;
  message;
  /**
   * Creates a new instance of CustomError.
   *
   * @param {number} statusCode - The HTTP status code associated with the error.
   * @param {string} message - The error message.
   */
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    Object.setPrototypeOf(this, _CustomError.prototype);
  }
};
var ValidationError = class _ValidationError extends Error {
  statusCode = 400;
  errors;
  message;
  /**
   * Creates a new instance of ValidationError.
   *
   * @param {Array<any>} errors - An array of error objects representing validation failures.
   * @param {string} message - The error message.
   */
  constructor(errors, message) {
    super(message);
    this.errors = errors;
    this.message = message;
    Object.setPrototypeOf(this, _ValidationError.prototype);
  }
  /**
   * Formats validation errors into an array of objects with paths and corresponding messages.
   *
   * @returns {Array<any>} An array of objects where each object represents a validation error with its path and message.
   */
  formatErrors() {
    return this.errors.map((err) => ({ [err.path]: err.msg }));
  }
};

// utils/error.ts
var handleErrorResponse = (err, res) => {
  const { statusCode, message } = err;
  if (err instanceof CustomError) {
    return res.status(statusCode).json({
      status: false,
      statusCode,
      message
    });
  }
  if (err instanceof ValidationError) {
    return res.status(statusCode).json({
      status: false,
      statusCode,
      message,
      errors: err.formatErrors()
    });
  }
  return res.status(400).json({
    status: false,
    message: err?.response?.data?.message || err.message || "Something went wrong"
  });
};

// middlewares/error-handler.ts
var errorHandler = (err, _req, res, _next) => {
  console.log("in error handler");
  handleErrorResponse(err, res);
};

// services/socket-service/index.ts
var import_socket = require("socket.io");
var import_redis_streams_adapter = require("@socket.io/redis-streams-adapter");
var SocketService = class _SocketService {
  /**
   * The socket server instance.
   */
  static instance = null;
  /**
   * Creates a socket server connection instance.
   *
   * @static
   * @param {HttpServer} httpServer - An instance of http server
   * @param {RedisClientType} redisClient - The related client socket id
   * @returns {SocketServer} An instance of connected socket server
   */
  static initialize(httpServer2, redisClient2) {
    const socketServer = new import_socket.Server(httpServer2, {
      cors: { origin: "*" },
      adapter: (0, import_redis_streams_adapter.createAdapter)(redisClient2)
    });
    socketServer.on("connection", () => {
      console.log("connected");
    });
    _SocketService._setInstance(socketServer);
    return socketServer;
  }
  /**
   * Creates a socket server namespace connection.
   *
   * @static
   * @param {string} namespace - The name identifier for the socket connection namespace
   * @returns {Namespace} An instance of namespace socket server connection
   */
  static useNamespaceConnection(namespace) {
    if (!_SocketService.instance) {
      throw new Error("No socket connection available to create namespace!");
    }
    return _SocketService.instance.of(namespace);
  }
  static _getInstance() {
    return _SocketService.instance;
  }
  /**
   * Sets an instance of connected socket server.
   *
   * @static
   * @param {SocketServer} socketServer - An instance of connected socket server
   */
  static _setInstance(socketServer) {
    _SocketService.instance = socketServer;
  }
};
var socket_service_default = SocketService;

// services/redis-service/index.ts
var import_redis = require("redis");

// config/app-config.ts
var import_config = require("dotenv/config");
var appConfig = {
  firebaseAdmin: {
    privateKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL
  },
  port: Number(process.env.PORT),
  baseUrl: process.env.BASE_URL,
  redis: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD
  },
  captcha: {
    apiKey: process.env.CAPTCHA_API_KEY
  },
  queueConcurrency: Number(process.env.QUEUE_CONCURRENCY) || 1,
  creatuulsPlatform: {
    apiEndpoint: process.env.CREATUULS_PLATFORM_API,
    adminApiKey: process.env.CREATUULS_PLATFORM_ADMIN_API_KEY,
    apiKeyHeader: process.env.CREATUULS_PLATFORM_API_KEY_HEADER
  },
  dummySocketId: process.env.DUMMY_SOCKET_ID
};
var app_config_default = appConfig;

// services/redis-service/index.ts
var redisClient = (0, import_redis.createClient)({
  password: app_config_default.redis.password,
  socket: {
    host: app_config_default.redis.host,
    port: app_config_default.redis.port || 6379
  }
});
var redis_service_default = redisClient;

// services/firebase-service/index.ts
var import_firebase_admin = __toESM(require("firebase-admin"));
var { firebaseAdmin } = app_config_default;
if (!import_firebase_admin.default.apps.length) {
  try {
    import_firebase_admin.default.initializeApp({
      projectId: firebaseAdmin.projectId,
      credential: import_firebase_admin.default.credential.cert({
        clientEmail: firebaseAdmin.clientEmail,
        privateKey: firebaseAdmin.privateKey?.replace(/\\n/g, "\n"),
        projectId: firebaseAdmin.projectId
      })
    });
  } catch (error) {
    console.log(error.message);
    throw new CustomError(401, "Unable to initialize authentication service");
  }
}
var auth = import_firebase_admin.default.auth();

// constants/integration-type.ts
var INTEGRATION_TYPE = {
  MAILCHIMP: "MAILCHIMP",
  SUBSTACK: "SUBSTACK"
};
var INTEGRATION_FLOW = {
  [INTEGRATION_TYPE.MAILCHIMP]: {
    LOGIN: "login",
    TOTP: "totp",
    SELECT_LIST: "select-list",
    EXTRACT_DATA: "extract-data"
  },
  [INTEGRATION_TYPE.SUBSTACK]: {
    LOGIN: "login",
    AUTH_LINK: "auth-link",
    SELECT_LIST: "select-list",
    EXTRACT_DATA: "extract-data"
  }
};

// constants/socket.ts
var NEWSLETTER_INTEGRATION_NAMESPACE = "/newsletter-integration";
var NW_INTEGRATION_JOIN = "nw_integration::join";
var NW_INTEGRATION_AUTH = "nw_integration::auth";
var NW_INTEGRATION_AUTH_OTP_REQ = "nw_integration::auth_otp_request";
var NW_INTEGRATION_AUTH_OTP_RES = "nw_integration::auth_otp_response";
var NW_INTEGRATION_AUDIENCE_LIST = "nw_integration::audience_list";
var NW_INTEGRATION_SELECT_AUDIENCE = "nw_integration::select_audience";
var NW_INTEGRATION_CONNECTION_ERR = "nw_integration::connection_error";
var NW_INTEGRATION_INSTANCE_STATUS = "nw_integration::instance_status";
var NW_INTEGRATION_AUTH_ERROR = "nw_integration::auth_error";
var NW_INTEGRATION_GENERIC_ERROR = "nw_integration::generic_error";
var NW_INTEGRATION_AUTH_SUCCESS = "nw_integration::auth_success";
var NW_INTEGRATION_FETCH_AUDIENCE_LIST = "nw_integration::fetch_audience_list";
var NW_INTEGRATION_AUTH_EMAIL_SENT = "nw_integration::auth_email_sent";
var NW_INTEGRATION_AUTH_LINK_REQ = "nw_integration::auth_link_request";
var NW_INTEGRATION_AUDIENCE_CONNECTED = "nw_integration::audience_connected";
var NW_INTEGRATION_TERMINATE_PROCESS = "nw_integration::terminate_process";
var NW_INTEGRATION_PROCESS_TERMINATED = "nw_integration::process_terminated";
var SOCKET_CHANNELS = { NEWSLETTER_INTEGRATION_NAMESPACE };
var SOCKET_EVENTS = {
  NW_INTEGRATION_JOIN,
  NW_INTEGRATION_AUTH,
  NW_INTEGRATION_AUTH_OTP_REQ,
  NW_INTEGRATION_AUTH_OTP_RES,
  NW_INTEGRATION_AUDIENCE_LIST,
  NW_INTEGRATION_SELECT_AUDIENCE,
  NW_INTEGRATION_CONNECTION_ERR,
  NW_INTEGRATION_INSTANCE_STATUS,
  NW_INTEGRATION_AUTH_ERROR,
  NW_INTEGRATION_GENERIC_ERROR,
  NW_INTEGRATION_AUTH_SUCCESS,
  NW_INTEGRATION_FETCH_AUDIENCE_LIST,
  NW_INTEGRATION_AUTH_EMAIL_SENT,
  NW_INTEGRATION_AUTH_LINK_REQ,
  NW_INTEGRATION_AUDIENCE_CONNECTED,
  NW_INTEGRATION_TERMINATE_PROCESS,
  NW_INTEGRATION_PROCESS_TERMINATED
};

// services/child-process-service/index.ts
var import_path = __toESM(require("path"));

// classes/child-process-manager.ts
var import_child_process = require("child_process");

// services/socket-service/utils.ts
var import_socket3 = require("socket.io");
var emitToClient = ({ socket, clientSocketId, event, data }) => {
  if (socket instanceof import_socket3.Namespace) {
    if (!clientSocketId) {
      throw new Error("Socket id is not defined for namespace emission");
    }
    socket.to(clientSocketId).emit(event, data);
  } else {
    socket.emit(event, data);
  }
};

// classes/child-process-manager.ts
var ChildProcessManager = class {
  processFile;
  _childrenMessageHandlers;
  _socketConn = null;
  _childProcesses = /* @__PURE__ */ new Map();
  /**
   * Creates a new instance of `ChildProcessManager`.
   *
   * @constructor
   * @param {ChildProcessManagerOptions} options - The options for configuring the `ChildProcessManager`.
   */
  constructor({ processFile, childrenMessageHandlers }) {
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
  createChildProcess(identifier, clientSocketId, argumentToChild) {
    const argumentToChildResolved = argumentToChild ? [identifier, clientSocketId, ...argumentToChild] : [identifier, clientSocketId];
    const child = (0, import_child_process.fork)(this.processFile, argumentToChildResolved);
    this._addChildProcess(identifier, child, clientSocketId);
    console.log(
      `[${child.pid}]: child process created for user with id: ${identifier}`
    );
    child.on("message", (message) => {
      console.log(
        `Processing message from child process ${identifier}:`,
        message?.type
      );
      if (this._childrenMessageHandlers && message?.type) {
        const handler = this._childrenMessageHandlers[message.type];
        return handler?.(message);
      }
    });
    child.on("error", (error) => {
      console.error(`Error in child process ${identifier}:`, error);
    });
    child.on("close", (code, signal) => {
      console.log(
        `Child process ${identifier} closed with code ${code} and signal ${signal}`
      );
    });
    child.on("exit", (code, signal) => {
      if (code !== 0 && code !== null) {
        const clientSocketId2 = this._getChildProcessClientSocketId(identifier);
        if (this._socketConn && clientSocketId2) {
          emitToClient({
            clientSocketId: clientSocketId2,
            data: { message: "Something went wrong, please try again" },
            event: SOCKET_EVENTS.NW_INTEGRATION_GENERIC_ERROR,
            socket: this._socketConn
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
  isChildProcessAlive(identifier) {
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
  sendMessageToChild(identifier, message) {
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
  setupSocketConn(socketConn) {
    this._socketConn = socketConn;
  }
  /**
   * Kills a child process.
   *
   * @method
   * @param {string} identifier - Identifies a child process
   */
  killChild(identifier) {
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
  _getChildProcess(identifier) {
    return this._childProcesses.get(identifier)?.childProcess;
  }
  /**
   * Gets the client socket id related to a child process.
   */
  _getChildProcessClientSocketId(identifier) {
    return this._childProcesses.get(identifier)?.clientSocketId;
  }
  /**
   * Adds child process to on memory map.
   */
  _addChildProcess(identifier, childProcess, clientSocketId) {
    this._childProcesses.set(identifier, { childProcess, clientSocketId });
  }
  /**
   * Removes child process from on memory map.
   */
  _removeChildProcess(identifier) {
    this._childProcesses.delete(identifier);
  }
};
var createChildProcessManager = (processFilePath2) => {
  return new ChildProcessManager({
    processFile: processFilePath2
  });
};

// services/child-process-service/index.ts
var processFilePath = import_path.default.join(__dirname, "./process-file");
var childProcessManager = createChildProcessManager(processFilePath);
var addJobToChildProcess = ({ identifier, socketId, payload }) => {
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

// constants/process-message-type.ts
var process_message_type_default = {
  AUTH: "auth",
  AUDIENCE_FETCH_INIT: "audience_fetch_init",
  SELECT_AUDIENCE: "select_audience",
  AUTH_LINK_RECEIVED: "auth_link_received",
  AUTH_OTP_RECEIVED: "auth_otp_received"
};

// services/socket-service/event-handlers/newsletter-integration.handlers.ts
var {
  NW_INTEGRATION_JOIN: NW_INTEGRATION_JOIN2,
  NW_INTEGRATION_AUTH: NW_INTEGRATION_AUTH2,
  NW_INTEGRATION_AUTH_OTP_RES: NW_INTEGRATION_AUTH_OTP_RES2,
  NW_INTEGRATION_SELECT_AUDIENCE: NW_INTEGRATION_SELECT_AUDIENCE2,
  NW_INTEGRATION_FETCH_AUDIENCE_LIST: NW_INTEGRATION_FETCH_AUDIENCE_LIST2,
  NW_INTEGRATION_AUTH_LINK_REQ: NW_INTEGRATION_AUTH_LINK_REQ2,
  NW_INTEGRATION_TERMINATE_PROCESS: NW_INTEGRATION_TERMINATE_PROCESS2
} = SOCKET_EVENTS;
var {
  AUTH,
  AUDIENCE_FETCH_INIT,
  SELECT_AUDIENCE,
  AUTH_LINK_RECEIVED,
  AUTH_OTP_RECEIVED
} = process_message_type_default;
var onJoinConnection = (socket) => {
  console.log(`Socket connection established with socket ${socket.id}`);
};
var onAuthInit = (socket, data) => {
  const userId = socket.user?.sub;
  console.log(
    `${NW_INTEGRATION_AUTH2} socket event received from user id: ${userId}`
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
      clientSocketId: socket.id
    }
  });
};
var onAudienceListFetchInitiated = (socket, data) => {
  const userId = socket.user?.sub;
  console.log(
    `${NW_INTEGRATION_FETCH_AUDIENCE_LIST2} socket event received from user id: ${userId}`
  );
  addJobToChildProcess({
    identifier: userId,
    socketId: socket.id,
    payload: {
      ...data,
      type: AUDIENCE_FETCH_INIT,
      clientSocketId: socket.id,
      userId
    }
  });
};
var onAudienceSelected = (socket, data) => {
  const userId = socket.user?.sub;
  console.log(
    `${NW_INTEGRATION_SELECT_AUDIENCE2} socket event received from user id: ${userId}`
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
      accountIdentifier: data.accountIdentifier
    }
  });
};
var onTerminateProcess = (socket) => {
  const userId = socket.user?.sub;
  console.log(
    `${NW_INTEGRATION_TERMINATE_PROCESS2} socket event received from user id: ${userId}`
  );
  childProcessManager.killChild(userId);
};
var onAuthOtpReceived = (socket, data) => {
  const userId = socket.user?.sub;
  console.log(
    `${NW_INTEGRATION_AUTH_OTP_RES2} socket event received from user id: ${userId}`
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
      accountIdentifier: data.accountIdentifier
    }
  });
};
var onAuthLinkReceived = (socket, data) => {
  const userId = socket.user?.sub;
  console.log(
    `${NW_INTEGRATION_AUTH_LINK_REQ2} socket event received from user id: ${userId}`
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
        userId
      },
      accountIdentifier: data.accountIdentifier
    }
  });
};
var newsletter_integration_handlers_default = {
  [NW_INTEGRATION_JOIN2]: onJoinConnection,
  [NW_INTEGRATION_AUTH2]: onAuthInit,
  [NW_INTEGRATION_AUTH_OTP_RES2]: onAuthOtpReceived,
  [NW_INTEGRATION_SELECT_AUDIENCE2]: onAudienceSelected,
  [NW_INTEGRATION_FETCH_AUDIENCE_LIST2]: onAudienceListFetchInitiated,
  [NW_INTEGRATION_AUTH_LINK_REQ2]: onAuthLinkReceived,
  [NW_INTEGRATION_TERMINATE_PROCESS2]: onTerminateProcess
};

// services/socket-service/namespaces/newsletter-integration.ts
var { NEWSLETTER_INTEGRATION_NAMESPACE: NEWSLETTER_INTEGRATION_NAMESPACE2 } = SOCKET_CHANNELS;
var {
  NW_INTEGRATION_CONNECTION_ERR: NW_INTEGRATION_CONNECTION_ERR2,
  NW_INTEGRATION_JOIN: NW_INTEGRATION_JOIN3,
  NW_INTEGRATION_INSTANCE_STATUS: NW_INTEGRATION_INSTANCE_STATUS2
} = SOCKET_EVENTS;
var initNewsletterIntegrationSocketChannel = () => {
  const nwIntegrationNamespace = socket_service_default.useNamespaceConnection(
    NEWSLETTER_INTEGRATION_NAMESPACE2
  );
  childProcessManager.setupSocketConn(nwIntegrationNamespace);
  nwIntegrationNamespace.on("connection", (socket) => {
    socket.use(async (packet, next) => {
      const token = socket.handshake?.auth?.token?.replace("Bearer ", "");
      const query = socket.handshake.query;
      if (!token) {
        const error = new Error("not authorized");
        error.data = { content: "Please retry with auth token" };
        return next(error);
      }
      try {
        const user = await auth.verifyIdToken(token);
        socket.user = user;
        if (packet[0] === NW_INTEGRATION_JOIN3) {
          const canConnect = await redis_service_default.set(
            `users:${user.uid || user.sub}`,
            socket.id,
            {
              NX: true,
              EX: 30
            }
          );
          if (!canConnect) {
            emitToClient({
              socket,
              event: NW_INTEGRATION_INSTANCE_STATUS2,
              data: { active: true }
            });
          } else {
            emitToClient({
              socket,
              event: NW_INTEGRATION_INSTANCE_STATUS2,
              data: { active: false, query }
            });
          }
        }
        return next();
      } catch (err) {
        console.log(err);
        const error = new Error("not authorized");
        error.data = { content: "Please retry with auth token" };
        return next(error);
      }
    });
    Object.entries(newsletter_integration_handlers_default).forEach(([event, handler]) => {
      socket.once(event, (data) => handler(socket, data));
    });
    socket.conn.on("packet", async ({ type }) => {
      if (type === "pong" && socket.user) {
        const user = socket.user;
        await redis_service_default.set(`users:${user.uid || user.sub}`, socket.id, {
          XX: true,
          EX: 30
        });
      }
    });
    socket.on("error", (error) => {
      console.log(error, "handling socket error");
      emitToClient({
        socket,
        event: NW_INTEGRATION_CONNECTION_ERR2,
        data: {
          message: `${error.message}. ${error.data?.content || ""}`
        }
      });
    });
    socket.on("disconnect", async () => {
      console.log(`Socket ${socket.id} disconnected.`);
      if (socket.user) {
        const user = socket.user;
        const activeSocketForUser = await redis_service_default.get(
          `users:${user.uid || user.sub}`
        );
        if (activeSocketForUser === socket.id) {
          await redis_service_default.del(`users:${user.uid || user.sub}`);
        }
      }
    });
  });
};

// routers/bots/index.ts
var import_express3 = __toESM(require("express"));
var import_express_validator2 = require("express-validator");

// routers/bots/bot-type/mailchimp.ts
var import_express = __toESM(require("express"));
var name = "mailchimp";
var runBot = ({ userId, messagePayload }) => {
  addJobToChildProcess({
    identifier: userId,
    socketId: app_config_default.dummySocketId || "dummy-socket-id",
    payload: messagePayload
  });
};
var mailchimp_default = {
  /**
   * Runs puppeteer automation bot for mailchimp
   */
  run: async (args) => runBot(args),
  name,
  router: import_express.default.Router()
};

// routers/bots/bot-type/substack.ts
var import_express2 = __toESM(require("express"));
var name2 = "substack";
var runBot2 = ({ userId, messagePayload }) => {
  addJobToChildProcess({
    identifier: userId,
    socketId: app_config_default.dummySocketId || "dummy-socket-id",
    payload: messagePayload
  });
};
var substack_default = {
  /**
   * Runs puppeteer automation bot for substack
   */
  run: (args) => runBot2(args),
  name: name2,
  router: import_express2.default.Router()
};

// middlewares/validate-request.ts
var import_express_validator = require("express-validator");
var validate_request_default = (req, _res, next) => {
  const error = (0, import_express_validator.validationResult)(req);
  const hasErrors = !error.isEmpty();
  if (hasErrors) {
    throw new ValidationError(error.errors, "You are entering wrong data.");
  }
  next();
};

// middlewares/require-auth.ts
var import_axios = __toESM(require("axios"));
var { creatuulsPlatform } = app_config_default;
var require_auth_default = async (req, res, next) => {
  const authHeader = req.headers?.authorization;
  const creatuulsApiKey = req.headers?.[creatuulsPlatform.apiKeyHeader || ""];
  if (!authHeader && !creatuulsApiKey) {
    return res.status(401).send({ error: "Unauthorized request" });
  }
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return res.status(401).send({ error: "Unauthorized request" });
    }
    try {
      const user = await auth.verifyIdToken(token);
      req.user = user;
      return next();
    } catch (err) {
      console.log("Unable to verify auth token", err.message || err);
      return res.status(401).send({ error: "Unable to verify auth token" });
    }
  }
  if (creatuulsApiKey) {
    try {
      const response = await import_axios.default.get(
        `${creatuulsPlatform.apiEndpoint}/auth/me`,
        {
          headers: { [creatuulsPlatform.apiKeyHeader || ""]: creatuulsApiKey }
        }
      );
      req.user = response.data.data;
      return next();
    } catch (err) {
      console.log("Invalid api key", err.message || err);
      return res.status(401).send({ error: "Invalid api key" });
    }
  }
};

// routers/bots/index.ts
var { SELECT_AUDIENCE: SELECT_AUDIENCE2 } = process_message_type_default;
var { SUBSTACK, MAILCHIMP } = INTEGRATION_TYPE;
var router = import_express3.default.Router();
router.use("/mailchimp", mailchimp_default.router);
router.use("/substack", substack_default.router);
mailchimp_default.router.post(
  "/extract-data",
  require_auth_default,
  (0, import_express_validator2.body)("audienceName").isString(),
  (0, import_express_validator2.body)("audienceId").isString(),
  validate_request_default,
  (req, res) => {
    mailchimp_default.run({
      userId: req.user?.firebaseUserId || req.user?.sub,
      messagePayload: {
        clientSocketId: app_config_default.dummySocketId || "dummy-socket-id",
        type: SELECT_AUDIENCE2,
        userId: req.user?.firebaseUserId || req.user?.sub,
        newsletterIntegrationType: MAILCHIMP,
        inputData: {
          audienceId: req.body.audienceId,
          audienceName: req.body.audienceName
        }
      }
    });
    return res.send("Audience data extraction triggered");
  }
);
substack_default.router.post(
  "/extract-data",
  require_auth_default,
  (0, import_express_validator2.body)("publicationLink").isString(),
  (0, import_express_validator2.body)("userId").isString(),
  // using firebase user id here
  (0, import_express_validator2.body)("accountIdentifier").isString(),
  (0, import_express_validator2.body)("publisherChannelId").isString(),
  (0, import_express_validator2.body)("keepAlive").isBoolean(),
  validate_request_default,
  async (req, res) => {
    const { userId, publicationLink, accountIdentifier, publisherChannelId } = req.body;
    substack_default.run({
      userId,
      messagePayload: {
        clientSocketId: app_config_default.dummySocketId || "dummy-socket-id",
        type: SELECT_AUDIENCE2,
        userId,
        newsletterIntegrationType: SUBSTACK,
        inputData: {
          publicationLink,
          publisherChannelId
        },
        accountIdentifier
      }
    });
    return res.send("Audience data extraction triggered");
  }
);
var bots_default = router;

// app.ts
var app = (0, import_express4.default)();
var httpServer = (0, import_http.createServer)(app);
app.use(import_express4.default.json());
app.get("/health-check", (_req, res) => res.send("pong"));
app.use("/bots", bots_default);
app.use(errorHandler);
async function main() {
  try {
    await redis_service_default.connect();
    socket_service_default.initialize(httpServer, redis_service_default);
    initNewsletterIntegrationSocketChannel();
    await new Promise((resolve, reject) => {
      const server = httpServer.listen(app_config_default.port || 80, () => {
        const address = server.address();
        const port = typeof address === "string" ? address : address?.port;
        console.info(`listening on ${port}`);
        resolve();
      });
      server.on("error", (err) => {
        reject(err);
      });
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
main();
