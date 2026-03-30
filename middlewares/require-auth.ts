import { Request, Response, NextFunction } from "express";
import { appConfig } from "../config";
import { auth } from "../services/firebase-service";
import axios from "axios";

const { creatuulsPlatform } = appConfig;

export default async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers?.authorization;
  const creatuulsApiKey = req.headers?.[creatuulsPlatform.apiKeyHeader || ""];

  if (!authHeader && !creatuulsApiKey) {
    return res.status(401).send({ error: "Unauthorized request" });
  }

  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return res.status(401).send({ error: "Unauthorized request" });
    }

    try {
      const user = await auth.verifyIdToken(token);
      req.user = user;
      return next();
    } catch (err: any) {
      console.log("Unable to verify auth token", err.message || err);
      return res.status(401).send({ error: "Unable to verify auth token" });
    }
  }

  if (creatuulsApiKey) {
    try {
      const response = await axios.get(
        `${creatuulsPlatform.apiEndpoint}/auth/me`,
        {
          headers: { [creatuulsPlatform.apiKeyHeader || ""]: creatuulsApiKey },
        }
      );

      req.user = response.data.data;
      return next();
    } catch (err: any) {
      console.log("Invalid api key", err.message || err);
      return res.status(401).send({ error: "Invalid api key" });
    }
  }
};
