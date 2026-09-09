import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/apiError.js';
import { makeErrorEnvelope } from '../utils/validation.js';

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ ok: false, message: 'Not found' });
}

export function errorHandler(error: Error, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ApiError) {
    const envelope = makeErrorEnvelope(error.code, error.message);
    res.status(error.status).json(error.details ? { ...envelope, details: error.details } : envelope);
    return;
  }
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json(makeErrorEnvelope('INVALID_INPUT', 'Invalid JSON body.'));
    return;
  }
  res.status(500).json(makeErrorEnvelope('server_error', 'Internal server error.'));
}
