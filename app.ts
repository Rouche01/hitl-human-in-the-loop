import express, { Request, Response } from "express";
import { createServer } from "http";

import { errorHandler } from "./middlewares/error-handler";
import SocketService from "./services/socket-service";
import redisClient from "./services/redis-service";
import { initNewsletterIntegrationSocketChannel } from "./services/socket-service/namespaces/newsletter-integration";
import { appConfig } from "./config";
import botsRouter from "./routers/bots";

const app = express();
const httpServer = createServer(app);

app.use(express.json());
app.get("/health-check", (_req: Request, res: Response) => res.send("pong"));
app.use("/bots", botsRouter);
app.use(errorHandler);

async function main() {
  try {
    await redisClient.connect();

    SocketService.initialize(httpServer, redisClient);
    initNewsletterIntegrationSocketChannel();

    await new Promise<void>((resolve, reject) => {
      const server = httpServer.listen(appConfig.port || 80, () => {
        const address = server.address();
        const port = typeof address === "string" ? address : address?.port;
        console.info(`listening on ${port}`);
        resolve();
      });
      server.on("error", (err) => {
        reject(err);
      });
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
