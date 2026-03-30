import { SOCKET_EVENTS } from "../../../constants";
import { emitToClient } from "../../../services/socket-service/utils";
import { PuppeteerBot } from "../../../classes/puppeteer-bot";
import { Namespace } from "socket.io";

const { NW_INTEGRATION_AUDIENCE_LIST } = SOCKET_EVENTS;

const name = "select-list";

interface StageHelpers {
  puppeteerBot: PuppeteerBot;
  inputData: any;
  socketConn: Namespace;
  clientSocketId: string;
}

/**
 * A function that retrieves the configuration for the select-list stage
 */
const getStageConfig = (
  stageType: string = "intermediate",
  { puppeteerBot, socketConn, clientSocketId }: StageHelpers
) => {
  return {
    url: "https://us21.admin.mailchimp.com/lists/",
    stageType,
    sequence: [
      {
        selectors: ["iframe[id=fallback]", "#lists"],
        action: async ({ selectors }: any) => {
          if (!puppeteerBot.page) return;

          const iframeHandle = await puppeteerBot.page.waitForSelector(
            selectors[0]
          );
          if (!iframeHandle) return;

          const frameDocument = await iframeHandle.contentFrame();
          if (!frameDocument) return;

          const audienceList = await frameDocument.$eval(selectors[1], (el: any) => {
            return Array.from(el.querySelectorAll("a[title='List name']")).map(
              (e: any) => ({
                name: e.textContent,
                id: e.getAttribute("data-event-label"),
              })
            );
          });

          return audienceList;
        },
        order: 0,
      },
      {
        selectors: [],
        action: async ({ pipedData }: any) => {
          emitToClient({
            data: { lists: pipedData },
            event: NW_INTEGRATION_AUDIENCE_LIST,
            socket: socketConn,
            clientSocketId,
          });
        },
        order: 1,
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
