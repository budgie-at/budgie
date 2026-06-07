import { DEFAULT_RETRY_STATUS_CODES } from '../../core/client/base-bank-provider.client';

const HTTP_STATUS_TOO_MANY_REQUESTS = 429;

export const BINANCE_RETRY_STATUS_CODES = [...DEFAULT_RETRY_STATUS_CODES, HTTP_STATUS_TOO_MANY_REQUESTS];

export const BINANCE_RETRY_METHODS = ['get', 'post'];
