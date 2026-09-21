import type { RequestHandler } from 'express';
import type { createAdminSessions } from '../services/admin.service.js';
import { ApiError } from '../utils/apiError.js';
import { parseBearerToken } from '../utils/validation.js';

export function requireAdminSession(sessions: ReturnType<typeof createAdminSessions>): RequestHandler {
  return (req, _res, next) => {
    const token = parseBearerToken(req.headers.authorization);
    if (!token || !sessions.valid(token)) { next(new ApiError(401, 'INVALID_ADMIN_SESSION', 'Sign in to the Admin Portal.')); return; }
    next();
  };
}
