import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { ValidationError } from "../classes/error";

export default (req: Request, _res: Response, next: NextFunction) => {
  const error = validationResult(req);
  const hasErrors = !error.isEmpty();

  if (hasErrors) {
    throw new ValidationError((error as any).errors, "You are entering wrong data.");
  }

  next();
};
