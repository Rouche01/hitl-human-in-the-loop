import { SOCKET_EVENTS, INTEGRATION_TYPE } from "../../../constants";
import { saveSessionCookies } from "../../../services/bot-service/utils";
import { emitToClient } from "../../../services/socket-service/utils";
import { PuppeteerBot } from "../../../classes/puppeteer-bot";
import { Namespace } from "socket.io";

const { NW_INTEGRATION_AUTH_SUCCESS, NW_INTEGRATION_AUTH_ERROR } = SOCKET_EVENTS;

const name = "auth-link";

interface StageHelpers {
  puppeteerBot: PuppeteerBot;
  inputData: any;
  socketConn: Namespace;
  clientSocketId: string;
  accountIdentifier?: string;
}

const getStageConfig = (
  stageType: string = "intermediate",
  { puppeteerBot, inputData, socketConn, clientSocketId, accountIdentifier }: StageHelpers
) => {
  return {
    url: inputData.authLink,
    stageType,
    sequence: [
      {
        selectors: ["button[data-href^='https://']"],
        action: async ({ selectors }: any) => {
          if (!puppeteerBot.page) return;

          await puppeteerBot.page.goto("https://substack.com/browse", {
            waitUntil: "networkidle0",
          });

          const firstNavBtnEl = await puppeteerBot.page.waitForSelector(
            selectors[0]
          );

          if (!firstNavBtnEl) return;

          const firstNavBtnText = await puppeteerBot.page.evaluate(
            (el: any) => el.innerText,
            firstNavBtnEl
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
            console.log("Unable to authenticate with auth link");
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
        },
        order: 0,
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
