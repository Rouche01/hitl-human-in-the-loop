import puppeteer from "puppeteer-extra";
import RecaptchaPlugin from "puppeteer-extra-plugin-recaptcha";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { appConfig } from "../config";
import { Page, Browser } from "puppeteer";

/**
 * Represents PuppeteerBot options.
 */
export interface PuppeteerBotConfig {
  /** The user ID associated with the bot. */
  userId: string;
  /** Whether to prefer non-headless mode. */
  preferNonHeadless?: boolean;
}

/**
 * PuppeteerBot represents a bot using Puppeteer for web automation.
 */
class PuppeteerBot {
  public userId: string;
  public userDataDir: string;
  public preferNonHeadless: boolean;
  public page: Page | null = null;
  public browser: Browser | null = null;

  /**
   * Creates a new instance of PuppeteerBot.
   *
   * @constructor
   * @param {PuppeteerBotConfig} config - The options for configuring the PuppeteerBot.
   */
  constructor({ userId, preferNonHeadless = false }: PuppeteerBotConfig) {
    this.userId = userId;
    this.userDataDir = `./user-${this.userId}`;
    this.preferNonHeadless = preferNonHeadless;
  }

  /**
   * Starts the Puppeteer browser with configured options and plugins.
   */
  async startBrowser(): Promise<void> {
    if (!this.browser) {
      const options: any = {
        headless: this.preferNonHeadless ? false : "new",
        defaultViewport: null,
      };

      puppeteer.use(
        RecaptchaPlugin({
          provider: { id: "2captcha", token: appConfig.captcha.apiKey || "" },
          visualFeedback: true,
        })
      );

      puppeteer.use(StealthPlugin());

      this.browser = (await puppeteer.launch(options)) as unknown as Browser;
    }

    if (!this.page && this.browser) {
      this.page = await this.browser.newPage();

      this.page.on("close", () => {
        this.page = null;
      });
    }
  }

  /**
   * Stops the Puppeteer browser and closes the associated page.
   */
  async stopBrowser(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
      }
    } catch (error: any) {
      console.log("page failed to close", error.message);
    } finally {
      this.page = null;
    }

    try {
      if (this.browser) {
        await this.browser.close();
      }
    } catch (error: any) {
      console.log("browser failed to close", error.message);
    } finally {
      this.browser = null;
    }
  }

  /**
   * Initializes the Puppeteer bot by starting the browser.
   */
  async init(): Promise<void> {
    await this.startBrowser();
  }

  /**
   * De-initializes the Puppeteer bot by stopping the browser.
   */
  async deInit(): Promise<void> {
    try {
      await this.stopBrowser();
    } catch (error: any) {
      console.log("unable to de-init puppeteer bot", error);
    }
  }
}

/**
 * Creates an instance of `PuppeteerBot`
 *
 * @param {string} userId - User id
 * @param {boolean=} preferNonHeadless - Whether to prefer non-headless mode.
 * @returns {PuppeteerBot}
 */
const createPuppeteerBot = (userId: string, preferNonHeadless?: boolean): PuppeteerBot => {
  return new PuppeteerBot({ userId, preferNonHeadless });
};

export { PuppeteerBot, createPuppeteerBot };
