import { appConfig } from "../../../config";
import { SOCKET_EVENTS } from "../../../constants";
import { callPublisherChannelMetricUpdate } from "../../../services/http-service";
import { emitToClient } from "../../../services/socket-service/utils";
import numberUtils from "../../../utils/number";
import { PuppeteerBot } from "../../../classes/puppeteer-bot";
import { Namespace } from "socket.io";

const { convertPercentToFraction, convertStringToNumber, stripNonNumericFromString } = numberUtils;
const { NW_INTEGRATION_AUDIENCE_CONNECTED } = SOCKET_EVENTS;

const name = "extract-data";

interface StageHelpers {
  puppeteerBot: PuppeteerBot;
  inputData: any;
  socketConn: Namespace;
  clientSocketId: string;
}

const getStageConfig = (
  stageType: string = "intermediate",
  { puppeteerBot, inputData, socketConn, clientSocketId }: StageHelpers
) => {
  return {
    url: inputData.publicationLink,
    stageType,
    sequence: [
      {
        selectors: [
          "a[href='/publish/subscribers'] > div > h1",
          "a[href='/publish/stats/traffic'] > div > h1",
          "a[href='/publish/stats/emails'] > div > h1",
          "a[href^='/publish/posts/detail']",
          "div[class*='frontend-publish-post_management-detail-TabbedGraph-module__heroStatsTabs'] > div:nth-child(3) h2",
          "input[name='name']",
          "textarea[name='hero_text']",
          "form#logo img",
          "#basics div.themed-select",
          "div[class*='singleValue']",
        ],
        action: async ({ selectors }: any) => {
          if (!puppeteerBot.page) return;

          let audienceSize = 0;
          let averageOpenRate = 0;
          let thirtyDayViews = 0;
          let averageClickRate = 0;
          let pubName: string | null = null;
          let shortDesc: string | null = null;
          let logo: string | null = null;
          let categories: string[] = [];

          try {
            const audienceSizeHtmlText = await puppeteerBot.page.$eval(
              selectors[0],
              (el: any) => el.innerText
            );
            audienceSize = convertStringToNumber(
              stripNonNumericFromString(audienceSizeHtmlText)
            );
            console.log(audienceSize, "audienceSize");
          } catch (err: any) {
            console.log("Unable to retrieve audience size", err.message || err);
          }

          try {
            const averageOpenRateHtmlText = await puppeteerBot.page.$eval(
              selectors[2],
              (el: any) => el.innerText
            );
            const percentNumber = convertStringToNumber(
              stripNonNumericFromString(averageOpenRateHtmlText)
            );
            averageOpenRate = convertPercentToFraction(percentNumber);
            console.log(averageOpenRate, "averageOpenRate");
          } catch (err: any) {
            console.log(
              "Unable to retrieve average open rate",
              err.message || err
            );
          }

          try {
            const thirtyDayViewsHtmlText = await puppeteerBot.page.$eval(
              selectors[1],
              (el: any) => el.innerText
            );

            thirtyDayViews = convertStringToNumber(
              stripNonNumericFromString(thirtyDayViewsHtmlText)
            );
            console.log(thirtyDayViews, "thirtyDayViews");
          } catch (err: any) {
            console.log("Unable to retrieve views data", err.message || err);
          }

          try {
            await puppeteerBot.page.goto(
              inputData.publicationLink.replace("home", "posts"),
              { waitUntil: "networkidle0" }
            );

            const firstPostId = await puppeteerBot.page.$eval(
              selectors[3],
              (el: any) => {
                const href = el.getAttribute("href");
                const idWithQuery = href.split("/")[4];
                return idWithQuery.split("?")[0];
              }
            );

            const engagementStatPageUrl = `${inputData.publicationLink.replace(
              "home",
              "posts"
            )}/detail/${firstPostId}/engagement`;
            console.log(engagementStatPageUrl);

            await puppeteerBot.page.goto(engagementStatPageUrl, {
              waitUntil: "networkidle0",
            });

            const averageClickRateHtmlText = await puppeteerBot.page.$eval(
              selectors[4],
              (el: any) => el.innerText
            );

            const percentNumber = convertStringToNumber(
              stripNonNumericFromString(averageClickRateHtmlText)
            );
            averageClickRate = convertPercentToFraction(percentNumber);
            console.log(averageClickRate, "averageClickRate");
          } catch (err: any) {
            console.log(
              "Unable to retrieve average click rate data",
              err.message || err
            );
          }

          try {
            await puppeteerBot.page.goto(
              inputData.publicationLink.replace("home", "settings"),
              { waitUntil: "networkidle0" }
            );

            pubName = await puppeteerBot.page.$eval(
              selectors[5],
              (el: any) => el.value
            );

            shortDesc = await puppeteerBot.page.$eval(
              selectors[6],
              (el: any) => el.value
            );

            logo = await puppeteerBot.page.$eval(selectors[7], (el: any) =>
              el.getAttribute("src")
            );
          } catch (err: any) {
            console.log(
              "Unable to retrieve publication metadata",
              err.message || err
            );
          }

          try {
            categories = await puppeteerBot.page.$$eval(
              selectors[8],
              (els: any[], sel: string[]) => {
                return els.map((el: any) => {
                  return el.querySelector(sel[9])?.textContent || "";
                });
              },
              selectors
            );
          } catch (err: any) {
            console.log(
              "Unable to retrieve publication categories",
              err.message || err
            );
          }

          console.log({
            audienceSize,
            averageOpenRate,
            thirtyDayViews,
            averageClickRate,
            name: pubName,
            shortDesc,
            logo,
            categories,
          });

          if (
            clientSocketId === appConfig.dummySocketId &&
            inputData["publisherChannelId"]
          ) {
            console.log(inputData["publisherChannelId"]);
            const publisherChannelId = inputData["publisherChannelId"];

            await callPublisherChannelMetricUpdate(
              publisherChannelId,
              "NEWSLETTER",
              {
                clickthroughRate: averageClickRate,
                openRate: averageOpenRate,
                subscriberSize: audienceSize,
              }
            );

            return;
          }

          emitToClient({
            socket: socketConn,
            clientSocketId,
            event: NW_INTEGRATION_AUDIENCE_CONNECTED,
            data: {
              audienceData: {
                name: pubName,
                openRate: averageOpenRate,
                clickthroughRate: averageClickRate,
                shortDesc,
                logo,
                categories: categories || [],
                subscriberSize: audienceSize,
                audienceRef: inputData.publicationLink,
              },
            },
          });
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
