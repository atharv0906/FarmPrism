import type { NextFunction, Request, Response } from 'express';

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ ok: false, message: 'Not found' });
}

export function errorHandler(error: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error(error);
  res.status(500).json({ ok: false, message: 'Internal server error' });
}
