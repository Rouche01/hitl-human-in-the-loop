import express from "express";
import { addJobToChildProcess } from "../../../services/child-process-service";
import { appConfig } from "../../../config";
import { RunBotArgs } from "../types";

const name = "mailchimp";

/**
 * Runs puppeteer automation bot for mailchimp
 *
 * @param {RunBotArgs} args - The bot execution arguments
 */
const runBot = ({ userId, messagePayload }: RunBotArgs): void => {
  addJobToChildProcess({
    identifier: userId,
    socketId: appConfig.dummySocketId || "dummy-socket-id",
    payload: messagePayload,
  });
};

export default {
  /**
   * Runs puppeteer automation bot for mailchimp
   */
  run: async (args: RunBotArgs) => runBot(args),
  name,
  router: express.Router(),
};
