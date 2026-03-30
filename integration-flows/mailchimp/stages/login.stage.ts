import { SOCKET_EVENTS, INTEGRATION_TYPE } from "../../../constants";
import { saveSessionCookies } from "../../../services/bot-service/utils";
import { emitToClient } from "../../../services/socket-service/utils";
import { PuppeteerBot } from "../../../classes/puppeteer-bot";
import { Namespace } from "socket.io";

const {
  NW_INTEGRATION_AUTH_ERROR,
  NW_INTEGRATION_AUTH_OTP_REQ,
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
 * A function that retrieves the configuration for the login stage
 */
const getStageConfig = (
  stageType: string = "intermediate",
  { puppeteerBot, inputData, socketConn, clientSocketId, accountIdentifier }: StageHelpers
) => {
  return {
    url: "https://login.mailchimp.com",
    stageType,
    sequence: [
      {
        selectors: ["#username"],
        action: async ({ selectors, key }: any) => {
          if (puppeteerBot.page) {
            await puppeteerBot.page.type(selectors[0], inputData[key]);
          }
        },
        order: 0,
        key: "username",
      },
      {
        selectors: ["#password"],
        action: async ({ selectors, key }: any) => {
          if (puppeteerBot.page) {
            await puppeteerBot.page.type(selectors[0], inputData[key]);
          }
        },
        order: 1,
        key: "password",
      },
      {
        selectors: [],
        action: async () => {
          if (puppeteerBot.page) {
            await (puppeteerBot.page as any).solveRecaptchas();
          }
        },
        order: 2,
      },
      {
        selectors: [
          "#submit-btn",
          ".error-container",
          ".c-mediaBody--centered > p:nth-child(1)",
        ],
        action: async ({ selectors }: any) => {
          if (!puppeteerBot.page) return;
          try {
            await Promise.all([
              puppeteerBot.page.waitForNavigation({
                waitUntil: "networkidle0",
              }),
              puppeteerBot.page.click(selectors[0]),
            ]);

            const nextUrl = puppeteerBot.page.url();

            if (nextUrl === "https://login.mailchimp.com/login/post/") {
              const errorDivHandle = await puppeteerBot.page.waitForSelector(
                selectors[1]
              );
              if (errorDivHandle) {
                const errorMessage = await errorDivHandle.$eval(
                  selectors[2],
                  (el: any) => el.textContent
                );
                console.log("Login error:", errorMessage);
              }
              await puppeteerBot.stopBrowser();
              emitToClient({
                socket: socketConn,
                data: { message: "Wrong auth credentials, try again" },
                event: NW_INTEGRATION_AUTH_ERROR,
                clientSocketId,
              });
            } else {
              if (nextUrl.includes("login/tfa")) {
                emitToClient({
                  socket: socketConn,
                  data: { message: "Enter OTP to continue" },
                  event: NW_INTEGRATION_AUTH_OTP_REQ,
                  clientSocketId,
                });
                return;
              }
              await saveSessionCookies(
                inputData["userId"] || inputData["username"],
                accountIdentifier || "default",
                puppeteerBot.page,
                INTEGRATION_TYPE.MAILCHIMP
              );
              emitToClient({
                socket: socketConn,
                data: { message: "Mailchimp account connected successfully" },
                event: NW_INTEGRATION_AUTH_SUCCESS,
                clientSocketId,
              });
            }
          } catch (err: any) {
            console.log(err.message, "sequence error");
            // Do not exit process in production, but keeping original logic as port
            process.exit(1);
          }
        },
        order: 3,
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
