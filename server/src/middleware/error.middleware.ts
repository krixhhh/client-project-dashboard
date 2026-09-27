import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/response';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.errorCode);
  }

  console.error('[Unhandled Error]:', err);

  return sendError(res, 'An unexpected server error occurred', 500, 'INTERNAL_SERVER_ERROR');
}
