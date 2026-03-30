import { ElementHandle } from "puppeteer";
import { SOCKET_EVENTS, INTEGRATION_TYPE } from "../../../constants";
import { saveSessionCookies } from "../../../services/bot-service/utils";
import { emitToClient } from "../../../services/socket-service/utils";
import { PuppeteerBot } from "../../../classes/puppeteer-bot";
import { Namespace } from "socket.io";

const { NW_INTEGRATION_AUTH_SUCCESS, NW_INTEGRATION_AUTH_ERROR } = SOCKET_EVENTS;

const name = "totp";

interface StageHelpers {
  puppeteerBot: PuppeteerBot;
  inputData: any;
  socketConn: Namespace;
  clientSocketId: string;
  accountIdentifier?: string;
}

/**
 * A function that retrieves the configuration for the totp stage
 */
const getStageConfig = (
  stageType: string = "intermediate",
  { puppeteerBot, inputData, socketConn, clientSocketId, accountIdentifier }: StageHelpers
) => {
  return {
    url: "https://us21.admin.mailchimp.com/login/tfa?referrer=%2F&stay-signed-in=N&from=",
    stageType,
    sequence: [
      {
        selectors: ["#totp-token", "input[type='submit']"],
        action: async ({ selectors, key }: any) => {
          if (!puppeteerBot.page) return;

          const [otpInput, loginBtn] = await Promise.all([
            puppeteerBot.page.waitForSelector(selectors[0]),
            puppeteerBot.page.waitForSelector(selectors[1]),
          ]);

          if (otpInput && loginBtn) {
            await otpInput.type(inputData[key]);
            await loginBtn.click();
            await puppeteerBot.page.waitForNavigation({
              waitUntil: "networkidle0",
            });
          }
        },
        order: 0,
        key: "otp",
      },
      {
        selectors: ["#account-settings-btn"],
        action: async ({ selectors }: any) => {
          if (!puppeteerBot.page) return;

          await puppeteerBot.page.goto(
            "https://us21.admin.mailchimp.com/account/",
            {
              waitUntil: "networkidle0",
            }
          );

          const accountSettingsBtn = await puppeteerBot.page.waitForSelector(
            selectors[0]
          );

          if (accountSettingsBtn instanceof ElementHandle) {
            await saveSessionCookies(
              inputData["userId"] || inputData["username"],
              accountIdentifier || "default",
              puppeteerBot.page,
              INTEGRATION_TYPE.MAILCHIMP
            );
            emitToClient({
              socket: socketConn,
              clientSocketId,
              event: NW_INTEGRATION_AUTH_SUCCESS,
              data: {
                message: "Mailchimp account connected successfully",
              },
            });
          } else {
            await puppeteerBot.stopBrowser();
            emitToClient({
              socket: socketConn,
              clientSocketId,
              event: NW_INTEGRATION_AUTH_ERROR,
              data: {
                message: "Unable to connect Mailchimp account",
              },
            });
          }
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
