import { Request, Response, NextFunction } from "express";
import { handleErrorResponse } from "../utils/error";

const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.log("in error handler");
  handleErrorResponse(err, res);
};

export { errorHandler };
