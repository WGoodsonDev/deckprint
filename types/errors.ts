import type { Platform } from './core';

export interface FetchError {
  platform: Platform;
  reason: 'not_found' | 'rate_limited' | 'auth_required' | 'network_error' | 'unknown';
  message: string;
  statusCode?: number;
}
