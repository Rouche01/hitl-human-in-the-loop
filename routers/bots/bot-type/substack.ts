import express from "express";
import { addJobToChildProcess } from "../../../services/child-process-service";
import { appConfig } from "../../../config";
import { RunBotArgs } from "../types";

const name = "substack";

/**
 * Runs puppeteer automation bot for substack
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
   * Runs puppeteer automation bot for substack
   */
  run: (args: RunBotArgs) => runBot(args),
  name,
  router: express.Router(),
};
