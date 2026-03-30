import express, { Request, Response } from "express";
import { body } from "express-validator";
import mailchimpBot from "./bot-type/mailchimp";
import substackBot from "./bot-type/substack";
import validateRequest from "../../middlewares/validate-request";
import requireAuth from "../../middlewares/require-auth";
import PROCESS_MESSAGE_TYPE from "../../constants/process-message-type";
const { SELECT_AUDIENCE } = PROCESS_MESSAGE_TYPE;

import { INTEGRATION_TYPE } from "../../constants";
import { appConfig } from "../../config";
const { SUBSTACK, MAILCHIMP } = INTEGRATION_TYPE;

const router = express.Router();

router.use("/mailchimp", mailchimpBot.router);
router.use("/substack", substackBot.router);

mailchimpBot.router.post(
  "/extract-data",
  requireAuth,
  body("audienceName").isString(),
  body("audienceId").isString(),
  validateRequest,
  (req: Request, res: Response) => {
    mailchimpBot.run({
      userId: req.user?.firebaseUserId || req.user?.sub,
      messagePayload: {
        clientSocketId: appConfig.dummySocketId || "dummy-socket-id",
        type: SELECT_AUDIENCE,
        userId: (req.user?.firebaseUserId || req.user?.sub) as string,
        newsletterIntegrationType: MAILCHIMP,
        inputData: {
          audienceId: req.body.audienceId,
          audienceName: req.body.audienceName,
        },
      },
    });
    return res.send("Audience data extraction triggered");
  }
);

substackBot.router.post(
  "/extract-data",
  requireAuth,
  body("publicationLink").isString(),
  body("userId").isString(), // using firebase user id here
  body("accountIdentifier").isString(),
  body("publisherChannelId").isString(),
  body("keepAlive").isBoolean(),
  validateRequest,
  async (req: Request, res: Response) => {
    const { userId, publicationLink, accountIdentifier, publisherChannelId } =
      req.body;

    substackBot.run({
      userId,
      messagePayload: {
        clientSocketId: appConfig.dummySocketId || "dummy-socket-id",
        type: SELECT_AUDIENCE,
        userId,
        newsletterIntegrationType: SUBSTACK,
        inputData: {
          publicationLink,
          publisherChannelId,
        },
        accountIdentifier,
      },
    });

    return res.send("Audience data extraction triggered");
  }
);

export default router;
