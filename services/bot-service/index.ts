import { createPuppeteerBot, PuppeteerBot } from "../../classes/puppeteer-bot";
import { InitializeBotOpts } from "../../types/bot";

/**
 * A function that initializes a puppeteer bot.
 */
const initializeBot = async ({ userId }: InitializeBotOpts): Promise<PuppeteerBot> => {
  const puppeteerBot = createPuppeteerBot(userId, false);
  await puppeteerBot.init();

  return puppeteerBot;
};

export { initializeBot as initBot };
