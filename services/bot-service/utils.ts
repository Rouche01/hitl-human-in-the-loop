import fs from "fs-extra";
import path from "path";
import { promises as fsp } from "fs";
import { INTEGRATION_TYPE, FLOW_AUTH_TYPE, INTEGRATION_FLOW } from "../../constants";
import mailchimpFlowConfig from "../../integration-flows/mailchimp";
import substackFlowConfig from "../../integration-flows/substack";
import { FlowOptions, MappedStage, StageOptions } from "../../types/bot";
import { PuppeteerBot } from "../../classes/puppeteer-bot";
import { Namespace } from "socket.io";
import { SOCKET_EVENTS } from "../../constants";
import { emitToClient } from "../socket-service/utils";

const { MAILCHIMP, SUBSTACK } = INTEGRATION_TYPE;

const mapIntegrationTypeToFlowConfig: Record<string, any> = {
  [MAILCHIMP]: mailchimpFlowConfig,
  [SUBSTACK]: substackFlowConfig,
};

/**
 * A function that retrieves all the automated stages for an integration type
 */
const getStages = (integrationType: string): Record<string, MappedStage> => {
  const stagesPath = path.join(__dirname, `../../integration-flows/${integrationType.toLowerCase()}/stages`);
  return fs
    .readdirSync(stagesPath)
    .filter((n) => {
      // Adjusted regex to match the renamed .ts files
      return /^[a-z-0-9]+\.stage\.ts$/.test(n);
    })
    .map((n) => {
      // In a real TS app, we'd use static imports or structured registry.
      // For now, continuing with require as it's a port, but type-casting to MappedStage.
      const module = require(path.join(stagesPath, n));
      // Interop for default exports in CommonJS
      return module.default || module;
    })
    .reduce((prev: Record<string, MappedStage>, curr: any) => {
      if (curr && curr.name) {
        prev[curr.name] = curr as MappedStage;
      }
      return prev;
    }, {});
};

const traverseTransitionStages = async ({
  transitionStages,
  puppeteerBot,
  stagesRepo,
  socketConn,
  clientSocketId,
  accountIdentifier,
}: {
  transitionStages: any[];
  puppeteerBot: PuppeteerBot;
  stagesRepo: Record<string, MappedStage>;
  socketConn: Namespace;
  clientSocketId: string;
  accountIdentifier?: string;
}): Promise<void> => {
  if (!puppeteerBot.page) {
    console.log("no page instance");
    return;
  }
  const currentUrl = puppeteerBot.page.url();
  const nextStage = transitionStages.find(
    (transitionStage: any) => transitionStage.urlState === currentUrl
  );

  if (!nextStage) {
    return;
  }

  await startStage(
    {
      currentStage: nextStage.name,
      socketConn,
      stages: stagesRepo,
      puppeteerBot,
      clientSocketId,
      accountIdentifier,
    },
    "intermediate"
  );

  await traverseTransitionStages({
    transitionStages,
    puppeteerBot,
    stagesRepo,
    socketConn,
    clientSocketId,
    accountIdentifier,
  });
};

/**
 * A function that starts an automated flow with initialized puppeteer bot
 */
const startFlow = async ({
  clientSocketId,
  integrationType,
  flowName,
  inputData,
  socketConn,
  puppeteerBot,
  botPolicy, // keepAlive or kill
  userId,
  accountIdentifier,
}: FlowOptions): Promise<void> => {
  const flowConfig = mapIntegrationTypeToFlowConfig[integrationType];
  const stages = getStages(integrationType);
  const flow = flowConfig[flowName];

  if (!flow) {
    throw new Error(`Flow ${flowName} not found for integration ${integrationType}`);
  }

  const sessionCookies = await retrieveSessionCookies(
    userId,
    accountIdentifier || "default",
    integrationType
  );

  if (flow.authType === FLOW_AUTH_TYPE.AUTH && sessionCookies) {
    // remove old cookies if it exists
    await deleteSessionCookies(userId, accountIdentifier || "default", integrationType);
  }

  if (flow.authType === FLOW_AUTH_TYPE.AUTHED) {
    if (!sessionCookies) {
      throw new Error("Authentication is required for this automation!");
    }

    if (puppeteerBot.page) {
      // for pages that require auth set cookies if it's available
      await puppeteerBot.page.setCookie(...sessionCookies);
    }
  }

  const flowInitialStage = flow.initialStage;
  const flowTransitionStages = flow.transitionStages;
  const flowFinalStage = flow.finalStage;

  try {
    await startStage(
      {
        currentStage: flowInitialStage.name,
        ...(inputData && { input: inputData }),
        socketConn,
        stages,
        puppeteerBot,
        clientSocketId,
        accountIdentifier,
      },
      "initial"
    );

    if (flowTransitionStages) {
      await traverseTransitionStages({
        puppeteerBot,
        socketConn,
        stagesRepo: stages,
        transitionStages: flowTransitionStages,
        clientSocketId,
        accountIdentifier,
      });
    }

    if (puppeteerBot.page && flowFinalStage) {
      await startStage(
        {
          currentStage: flowFinalStage.name,
          socketConn,
          stages,
          puppeteerBot,
          clientSocketId,
          accountIdentifier,
        },
        "final"
      );
    }

    if (botPolicy !== "keepAlive") {
      await puppeteerBot.stopBrowser();
    }
  } catch (err: any) {
    console.log(err.message);
    process.exit(1);
  }
};

/**
 * A function that execute a sequence actions defined in a stage config
 */
const playSequence = async (sequences: any[]): Promise<void> => {
  let pipedData: any;
  for (let sequenceItem of sequences) {
    const sequenceItemSelectors = sequenceItem.selectors;
    const sequenceItemKey = sequenceItem.key;
    try {
      const returnedData = await sequenceItem.action({
        selectors: sequenceItemSelectors,
        ...(pipedData && { pipedData }),
        key: sequenceItemKey,
      });

      console.log(
        `Finished sequence => ${sequenceItem.order}`,
        `pipedData => ${returnedData}`
      );

      pipedData = returnedData;
    } catch (err: any) {
      console.log(
        err?.response?.data?.error?.message || err.message,
        "here is the error message"
      );
      process.exit(1);
    }
  }
};

/**
 * A function that starts an automated stage with initialized puppeteer bot
 */
const startStage = async (
  {
    currentStage,
    stages,
    input,
    socketConn,
    puppeteerBot,
    clientSocketId,
    accountIdentifier,
  }: StageOptions,
  stageType: string
): Promise<void> => {
  console.log(`Starting ${currentStage} stage`);
  const stage = stages[currentStage];
  if (!stage) {
    throw new Error(`Stage ${currentStage} not found`);
  }

  const stageConfig = stage.getConfig(stageType, {
    socketConn,
    puppeteerBot,
    clientSocketId,
    accountIdentifier,
    ...(input && { inputData: input }),
  });

  if (puppeteerBot.page) {
    await puppeteerBot.page.goto(stageConfig.url, {
      waitUntil: "networkidle0",
    });
    await playSequence(stageConfig.sequence);
  }
};

/**
 * A function that writes session cookies for a user to file
 */
const saveSessionCookies = async (
  userId: string,
  accountIdentifier: string,
  page: any,
  integrationType: string
): Promise<void> => {
  const cookies = await page.cookies();
  const dirPath = `./cookies/${integrationType.toLowerCase()}`;
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  await fsp.writeFile(
    `${dirPath}/user-${userId}-${accountIdentifier}.json`,
    JSON.stringify(cookies, null, 2)
  );
};

/**
 * A function that retrieves session cookies for an authenticated user from file
 */
const retrieveSessionCookies = async (
  userId: string,
  accountIdentifier: string,
  integrationType: string
): Promise<any[] | null> => {
  try {
    const cookiesString = await fsp.readFile(
      `./cookies/${integrationType.toLowerCase()}/user-${userId}-${accountIdentifier}.json`,
      "utf8"
    );
    return JSON.parse(cookiesString);
  } catch (err: any) {
    console.log(
      "Unable to retrieve session cookies for user",
      err.message || err
    );
    return null;
  }
};

/**
 * Deletes session cookies from file for a user
 */
const deleteSessionCookies = async (
  userId: string,
  accountIdentifier: string,
  integrationType: string
): Promise<void> => {
  console.log("deleting cookies");
  try {
    await fsp.rm(
      `./cookies/${integrationType.toLowerCase()}/user-${userId}-${accountIdentifier}.json`
    );
  } catch (err) {
    console.error(`Unable to delete session cookies for user ${userId}`);
  }
};

export {
  startFlow,
  saveSessionCookies,
  retrieveSessionCookies,
  deleteSessionCookies,
};
