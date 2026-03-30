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
 * Gets the configuration for a select-list stage in substack integration.
 */
const getStageConfig = (
  stageType: string = "intermediate",
  { puppeteerBot, socketConn, clientSocketId }: StageHelpers
) => {
  return {
    url: "https://substack.com/settings",
    stageType,
    sequence: [
      {
        selectors: [
          "#publications > div.reader2-settings-box",
          "a.reader2-settings-row",
          "div > div:nth-child(2) > div:nth-child(1)",
        ],
        action: async ({ selectors }: any) => {
          if (!puppeteerBot.page) return;

          const publicationList = await puppeteerBot.page.$eval(
            selectors[0],
            (el: any, sel: string[]) => {
              return Array.from(el.querySelectorAll(sel[1])).map((e: any) => {
                const publicationLink = e.getAttribute("href");
                const publicationTitle = e.querySelector(
                  sel[2]
                )?.textContent || "Unknown Publication";
                return {
                  name: publicationTitle,
                  link: publicationLink,
                };
              });
            },
            selectors
          );

          return publicationList;
        },
        order: 0,
      },
      {
        selectors: [],
        action: async ({ pipedData }: any) => {
          emitToClient({
            socket: socketConn,
            clientSocketId,
            event: NW_INTEGRATION_AUDIENCE_LIST,
            data: { lists: pipedData },
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
