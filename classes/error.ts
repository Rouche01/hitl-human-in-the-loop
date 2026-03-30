/**
 * CustomError class represents a custom error with a status code and a message.
 */
class CustomError extends Error {
  public statusCode: number;
  public message: string;

  /**
   * Creates a new instance of CustomError.
   *
   * @param {number} statusCode - The HTTP status code associated with the error.
   * @param {string} message - The error message.
   */
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

/**
 * ValidationError class represents an error for validation failures.
 */
class ValidationError extends Error {
  public statusCode: number = 400;
  public errors: any[];
  public message: string;

  /**
   * Creates a new instance of ValidationError.
   *
   * @param {Array<any>} errors - An array of error objects representing validation failures.
   * @param {string} message - The error message.
   */
  constructor(errors: any[], message: string) {
    super(message);
    this.errors = errors;
    this.message = message;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  /**
   * Formats validation errors into an array of objects with paths and corresponding messages.
   *
   * @returns {Array<any>} An array of objects where each object represents a validation error with its path and message.
   */
  formatErrors() {
    return this.errors.map((err) => ({ [err.path]: err.msg }));
  }
}

export { CustomError, ValidationError };
