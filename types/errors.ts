import type { Platform } from './core';

export type FetchErrorReason =
  | 'not_found'
  | 'rate_limited'
  | 'auth_required'
  | 'network_error'
  | 'unknown';

export class FetchError extends Error {
  readonly platform: Platform;
  readonly reason: FetchErrorReason;
  readonly statusCode?: number;

  constructor(
    platform: Platform,
    reason: FetchErrorReason,
    message: string,
    statusCode?: number
  ) {
    super(message);
    this.name = 'FetchError';
    this.platform = platform;
    this.reason = reason;
    this.statusCode = statusCode;
  }
}
