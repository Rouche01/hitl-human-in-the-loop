import { ElementHandle } from "puppeteer";
import { saveSessionCookies } from "../../../services/bot-service/utils";
import { SOCKET_EVENTS, INTEGRATION_TYPE } from "../../../constants";
import { emitToClient } from "../../../services/socket-service/utils";
import { PuppeteerBot } from "../../../classes/puppeteer-bot";
import { Namespace } from "socket.io";

const {
  NW_INTEGRATION_AUTH_EMAIL_SENT,
  NW_INTEGRATION_AUTH_ERROR,
  NW_INTEGRATION_AUTH_SUCCESS,
} = SOCKET_EVENTS;

const name = "login";

interface StageHelpers {
  puppeteerBot: PuppeteerBot;
  inputData: any;
  socketConn: Namespace;
  clientSocketId: string;
  accountIdentifier?: string;
}

/**
 * Gets the configuration for a login stage in substack integration.
 */
const getStageConfig = (
  stageType: string = "intermediate",
  { puppeteerBot, inputData, socketConn, clientSocketId, accountIdentifier }: StageHelpers
) => {
  return {
    url: "https://substack.com/sign-in",
    stageType,
    sequence: [
      {
        selectors: ["input[type=email]"],
        action: async ({ selectors, key }: any) => {
          if (puppeteerBot.page) {
            await puppeteerBot.page.type(selectors[0], inputData[key]);
          }
        },
        order: 0,
        key: "email",
      },
      {
        selectors: ["input[type=password]", "a.substack-login__login-option"],
        action: async ({ selectors, key }: any) => {
          if (puppeteerBot.page) {
            if (inputData[key]) {
              await puppeteerBot.page.click(selectors[1]);
              await puppeteerBot.page.type(selectors[0], inputData[key]);
              return { usePassword: true };
            } else {
              return { usePassword: false };
            }
          }
          return { usePassword: false };
        },
        order: 1,
        key: "password",
      },
      {
        selectors: [
          "button[type=submit]",
          "#substack-login > div:nth-child(2)  > div:nth-child(2) > h4",
          "#error-container",
          "button[data-href^='https://']",
        ],
        action: async ({ selectors, pipedData }: any) => {
          if (!puppeteerBot.page) return;
          const { usePassword } = pipedData;
          try {
            await puppeteerBot.page.click(selectors[0]);
            if (usePassword) {
              let el: ElementHandle | null = null;

              try {
                el = await puppeteerBot.page.waitForSelector(selectors[2], { timeout: 5000 });
              } catch (err) {
                // If error container doesn't show up, maybe we succeeded
                try {
                  await puppeteerBot.page.waitForSelector(selectors[3], { timeout: 10000 });

                  const firstNavBtnText = await puppeteerBot.page.$eval(
                    selectors[3],
                    (el: any) => el.innerText
                  );

                  if (firstNavBtnText === "Dashboard") {
                    await saveSessionCookies(
                      inputData["userId"],
                      accountIdentifier || "default",
                      puppeteerBot.page,
                      INTEGRATION_TYPE.SUBSTACK
                    );
                    emitToClient({
                      socket: socketConn,
                      clientSocketId,
                      event: NW_INTEGRATION_AUTH_SUCCESS,
                      data: {
                        message: "Substack account connected successfully",
                      },
                    });
                  } else {
                    await puppeteerBot.stopBrowser();
                    emitToClient({
                      socket: socketConn,
                      clientSocketId,
                      event: NW_INTEGRATION_AUTH_ERROR,
                      data: {
                        message: "Unable to connect Substack account",
                      },
                    });
                  }
                } catch (innerErr) {
                   console.error("Timeout waiting for success/error indicator", innerErr);
                }
              }

              if (el) {
                await puppeteerBot.stopBrowser();
                emitToClient({
                  socket: socketConn,
                  clientSocketId,
                  event: NW_INTEGRATION_AUTH_ERROR,
                  data: {
                    message: "Wrong auth credentials",
                  },
                });
              } else {
                // Already handled in success block above, but keeping structure
              }
            } else {
              const checkEmailHandle = await puppeteerBot.page.waitForSelector(
                selectors[1]
              );

              if (checkEmailHandle) {
                const checkEmailText = await puppeteerBot.page.evaluate(
                  (el: any) => el.innerText,
                  checkEmailHandle
                );

                if (checkEmailText === "Check your email") {
                  emitToClient({
                    socket: socketConn,
                    clientSocketId,
                    event: NW_INTEGRATION_AUTH_EMAIL_SENT,
                    data: {
                      message:
                        "You have received an email with a link that you can use to sign in",
                    },
                  });
                } else {
                  await puppeteerBot.stopBrowser();
                  emitToClient({
                    socket: socketConn,
                    clientSocketId,
                    event: NW_INTEGRATION_AUTH_ERROR,
                    data: {
                      message: "Unable to connect Substack account",
                    },
                  });
                }
              }
            }
          } catch (err: any) {
            console.error("Login stage error:", err.message);
            process.exit(1);
          }
        },
        order: 2,
      },
    ],
  };
};

export default {
  name,
  getConfig(stageType: string, stageHelpers: StageHelpers) {
    return getStageConfig(stageType, stageHelpers);
  },
};
