import { Response } from "express";
import { CustomError, ValidationError } from "../classes/error";

const handleErrorResponse = (err: any, res: Response) => {
  const { statusCode, message } = err;
  
  if (err instanceof CustomError) {
    return res.status(statusCode).json({
      status: false,
      statusCode,
      message,
    });
  }

  if (err instanceof ValidationError) {
    return res.status(statusCode).json({
      status: false,
      statusCode,
      message,
      errors: err.formatErrors(),
    });
  }

  return res.status(400).json({
    status: false,
    message:
      err?.response?.data?.message || err.message || "Something went wrong",
  });
};

export { handleErrorResponse };
