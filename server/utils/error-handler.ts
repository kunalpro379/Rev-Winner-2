import { Response } from 'express';
import { ZodError } from 'zod';

/**
 * Format Zod validation errors into user-friendly messages
 */
export function formatZodError(error: ZodError): string {
  const firstError = error.errors[0];
  const fieldName = firstError.path.join('.') || 'Input';
  return `${fieldName}: ${firstError.message}`;
}

/**
 * Send error response with proper formatting
 * Handles Zod errors, standard errors, and unknown errors
 */
export function sendErrorResponse(
  res: Response,
  error: any,
  defaultMessage: string = 'An error occurred',
  statusCode: number = 400
): void {
  // Handle Zod validation errors
  if (error.name === 'ZodError' || error instanceof ZodError) {
    return res.status(400).json({
      error: formatZodError(error)
    });
  }

  // Handle standard errors
  if (error instanceof Error) {
    return res.status(statusCode).json({
      error: error.message || defaultMessage
    });
  }

  // Handle unknown errors
  res.status(statusCode).json({
    error: defaultMessage
  });
}

/**
 * Wrap async route handlers with error handling
 */
export function asyncHandler(fn: Function) {
  return (req: any, res: Response, next: Function) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      console.error('[AsyncHandler] Error:', error);
      sendErrorResponse(res, error, 'Internal server error', 500);
    });
  };
}
