export class ApiError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string, public readonly details?: Record<string, unknown>) {
    super(message);
  }
}

const conflicts = new Set([
  'BATCH_ALREADY_LISTED', 'PENDING_REQUEST_EXISTS', 'JOB_ALREADY_CLAIMED',
  'QUANTITY_EXCEEDS_AVAILABLE', 'INSUFFICIENT_AVAILABLE_QUANTITY', 'PRICE_BELOW_RESERVE',
  'OTP_EXPIRED', 'OTP_ATTEMPTS_EXCEEDED', 'OTP_NOT_AVAILABLE', 'CAPACITY_EXCEEDED',
  'QUALITY_GRADE_REQUIRED', 'AUCTION_NOT_ACCEPTABLE', 'BID_NOT_ACCEPTABLE',
  'LISTING_NOT_ACCEPTABLE', 'REQUEST_NOT_ACCEPTABLE', 'AUCTION_NOT_OPEN',
  'LISTING_NOT_ACTIVE', 'BID_NOT_WITHDRAWABLE', 'REQUEST_NOT_WITHDRAWABLE',
  'LOGISTICS_NOT_ASSIGNED', 'LOGISTICS_NOT_READY', 'LOGISTICS_FEE_NOT_READY',
  'NO_FEE_PROPOSAL', 'ORDER_NOT_COMPLETED',
  'BATCH_CURRENTLY_LISTED', 'BID_NOT_REJECTABLE', 'REQUEST_NOT_REJECTABLE',
]);

export function mapRpcError(error: { message: string }): ApiError {
  // Match the complete exception token, never return SQL, details, hints or arbitrary messages.
  const code = error.message.trim();
  if (code === 'INVALID_INPUT' || code === 'INVALID_OTP' || code === 'INVALID_QUALITY_GRADE') {
    return new ApiError(400, code, code === 'INVALID_OTP' ? 'Invalid delivery OTP.' : code === 'INVALID_QUALITY_GRADE' ? 'Quality grade must be A, B, or C.' : 'Invalid input.');
  }
  if (code === 'FORBIDDEN') return new ApiError(403, code, 'This action is not allowed.');
  if (/^[A-Z_]+_NOT_FOUND$/.test(code)) return new ApiError(404, code, 'Resource not found.');
  if (conflicts.has(code) || /^INVALID_[A-Z_]+_STATE$/.test(code)) {
    return new ApiError(409, code, code.toLowerCase().replaceAll('_', ' ') + '.');
  }
  return new ApiError(500, 'server_error', 'Internal server error.');
}
