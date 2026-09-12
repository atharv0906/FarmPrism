export type ApiRequestMethod = 'GET' | 'POST';

export type ApiSuccessEnvelope<T> = {
  data: T;
};

export type ApiErrorEnvelope = {
  error: {
    code: string;
    message: string;
  };
};

export type ApiResponse<T> = ApiSuccessEnvelope<T> | ApiErrorEnvelope;

export type ApiRequestOptions = {
  method?: ApiRequestMethod;
  body?: unknown;
  bearerToken?: string;
  headers?: Record<string, string>;
};
