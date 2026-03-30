import { Request } from "express";
import { Socket } from "socket.io";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }

  interface Error {
    data?: any;
  }
}

declare module "socket.io" {
  interface Socket {
    user?: any;
  }
}
