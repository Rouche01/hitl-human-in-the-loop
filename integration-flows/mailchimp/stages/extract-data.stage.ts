import { SOCKET_EVENTS } from "../../../constants";
import { emitToClient } from "../../../services/socket-service/utils";
import { PuppeteerBot } from "../../../classes/puppeteer-bot";
import { Namespace } from "socket.io";

const { NW_INTEGRATION_AUDIENCE_CONNECTED } = SOCKET_EVENTS;

const name = "extract-data";

interface StageHelpers {
  puppeteerBot: PuppeteerBot;
  inputData: any;
  socketConn: Namespace;
  clientSocketId: string;
}

/**
 * A function that retrieves the configuration for the extract-data stage
 */
const getStageConfig = (
  stageType: string = "intermediate",
  { puppeteerBot, inputData, socketConn, clientSocketId }: StageHelpers
) => {
  return {
    url: `https://us21.admin.mailchimp.com/lists/dashboard/overview?id=${inputData["audienceId"]}`,
    stageType,
    sequence: [
      {
        selectors: [
          "iframe[id=fallback]",
          "#dashboard-content",
          "div:nth-child(2) > div.line.sub-section > div > div:nth-child(1) > h3 > a",
          "div:nth-child(2) > div.line.section > div.unit.size1of2.maintain-width > p > span.h4",
          "div:nth-child(2) > div.line.section > div.lastUnit.size1of2 > p > span.h4",
          ".c-inlineMeter",
          "div.c-inlineMeter_range > p",
          "div.c-inlineMeter_perc > p > span",
          "#genderLegendContainer",
          ".unit",
          "span.fwn",
          "span[data-mc-group='countUp'] > span",
        ],
        action: async ({ selectors }: any) => {
          if (!puppeteerBot.page) return;

          const iframeHandle = await puppeteerBot.page.waitForSelector(
            selectors[0]
          );
          if (!iframeHandle) return;

          const frameDocument = await iframeHandle.contentFrame();
          if (!frameDocument) return;

          const audienceData = await frameDocument.$eval(
            selectors[1],
            (el: any, sel: string[]) => {
              let audienceSize = 0;
              let averageOpenRate = 0;
              let averageClickRate = 0;
              let ageDemography = null;
              let genderDemography = null;

              const convertPercentStringToFraction = (percentString: string | null) => {
                if (!percentString) {
                  return 0;
                }
                const numberString = percentString.replace("%", "");
                return parseInt(numberString) / 100;
              };

              try {
                const sizeText = el.querySelector(sel[2])?.textContent || "0";
                audienceSize = parseInt(sizeText.replace(/,/g, ""));
              } catch {}

              try {
                averageOpenRate = convertPercentStringToFraction(
                  el.querySelector(sel[3])?.textContent
                );
              } catch {}

              try {
                averageClickRate = convertPercentStringToFraction(
                  el.querySelector(sel[4])?.textContent
                );
              } catch {}

              try {
                ageDemography = Array.from(
                  el.querySelectorAll(sel[5])
                ).map((item: any) => ({
                  [item.querySelector(sel[6])?.textContent || "Unknown"]:
                    convertPercentStringToFraction(
                      item.querySelector(sel[7])?.textContent
                    ),
                }));
              } catch {}

              try {
                const genderDataElement = el.querySelector(sel[8]);
                if (genderDataElement) {
                  genderDemography = Array.from(
                    genderDataElement.querySelectorAll(sel[9])
                  ).map((item: any) => ({
                    [item.querySelector(sel[10])?.textContent || "Unknown"]:
                      convertPercentStringToFraction(
                        item.querySelector(sel[11])?.textContent
                      ),
                  }));
                }
              } catch {}

              return {
                subscriberSize: audienceSize,
                openRate: averageOpenRate,
                clickthroughRate: averageClickRate,
                ageDemography,
                genderDemography,
                shortDesc: "Update your short description",
                categories: [],
              };
            },
            selectors
          );

          console.log("Audience data extracted:", audienceData);

          emitToClient({
            socket: socketConn,
            clientSocketId,
            data: {
              audienceData: {
                ...audienceData,
                name: inputData["audienceName"],
              },
            },
            event: NW_INTEGRATION_AUDIENCE_CONNECTED,
          });
        },
        order: 0,
        key: "username",
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
