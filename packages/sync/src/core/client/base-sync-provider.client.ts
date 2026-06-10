import ky, { HTTPError, TimeoutError } from 'ky';

import { getErrorMessage } from '@rnw-community/shared';

import { SyncErrorCodeEnum } from '../enum/sync-error-code.enum';
import { SyncError } from '../error/sync.error';
import { syncLogger } from '../util/sync-logger.util';

import type { SyncProviderEnum } from '../enum/sync-provider.enum';
import type { SyncAccountInterface } from '../interface/sync-account.interface';
import type { SyncClientInfoInterface } from '../interface/sync-client-info.interface';
import type { SyncErrorInterface } from '../interface/sync-error.interface';
import type { SyncProviderClientInterface } from '../interface/sync-provider-client.interface';
import type { SyncResultInterface } from '../interface/sync-result.type';
import type { SyncTransactionInterface } from '../interface/sync-transaction.interface';

const HTTP_STATUS_BAD_REQUEST = 400;

const HTTP_STATUS_UNAUTHORIZED = 401;
const HTTP_STATUS_FORBIDDEN = 403;
const HTTP_STATUS_REQUEST_TIMEOUT = 408;
const HTTP_STATUS_TOO_MANY_REQUESTS = 429;
const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;
const HTTP_STATUS_BAD_GATEWAY = 502;
const HTTP_STATUS_SERVICE_UNAVAILABLE = 503;
const HTTP_STATUS_GATEWAY_TIMEOUT = 504;

export const DEFAULT_RETRY_STATUS_CODES = [
    HTTP_STATUS_REQUEST_TIMEOUT,
    HTTP_STATUS_INTERNAL_SERVER_ERROR,
    HTTP_STATUS_BAD_GATEWAY,
    HTTP_STATUS_SERVICE_UNAVAILABLE,
    HTTP_STATUS_GATEWAY_TIMEOUT
];

const DEFAULT_RETRY_METHODS = ['get'];
const DEFAULT_RETRY_LIMIT = 3;
const DEFAULT_TIMEOUT_MS = 30000;

export abstract class BaseSyncProviderClient implements SyncProviderClientInterface {
    protected readonly retryLimit: number;
    protected readonly timeoutMs: number;
    protected readonly retryStatusCodes: number[];
    protected readonly retryMethods: string[];

    protected abstract readonly provider: SyncProviderEnum;
    protected abstract readonly baseUrl: string;

    constructor(
        protected readonly token: string,
        options?: {
            readonly retryLimit?: number;
            readonly timeoutMs?: number;
            readonly retryStatusCodes?: number[];
            readonly retryMethods?: string[];
        }
    ) {
        this.retryLimit = options?.retryLimit ?? DEFAULT_RETRY_LIMIT;
        this.timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
        this.retryStatusCodes = options?.retryStatusCodes ?? DEFAULT_RETRY_STATUS_CODES;
        this.retryMethods = options?.retryMethods ?? DEFAULT_RETRY_METHODS;
    }

    protected success<T>(data: T): SyncResultInterface<T> {
        return { success: true, data };
    }

    protected failure<T>(error: SyncErrorInterface): SyncResultInterface<T> {
        return { success: false, error };
    }

    protected async fetchJson<T>(endpoint: string, options?: RequestInit): Promise<SyncResultInterface<T>> {
        const url = `${this.baseUrl}${endpoint}`;
        syncLogger.log('http:request', { provider: this.provider, endpoint });
        try {
            const data = await ky(url, {
                ...options,
                headers: {
                    ...this.getDefaultHeaders(),
                    // eslint-disable-next-line @typescript-eslint/no-misused-spread
                    ...options?.headers
                },
                timeout: this.timeoutMs,
                retry: {
                    limit: this.retryLimit,
                    methods: this.retryMethods,
                    statusCodes: this.retryStatusCodes
                },
                hooks: {
                    afterResponse: [state => void this.onResponseHeaders(state.response.headers)]
                }
            }).json<T>();
            syncLogger.log('http:response:ok', {
                provider: this.provider,
                endpoint,
                isArray: Array.isArray(data),
                ...(Array.isArray(data) && { size: data.length })
            });

            return this.success(data);
        } catch (error) {
            return this.handleError<T>(error);
        }
    }

    protected onResponseHeaders(_headers: Headers): void {
        return void 0;
    }

    // eslint-disable-next-line max-statements -- Instrumented with diagnostic logs (temporary)
    private handleError<T>(error: unknown): SyncResultInterface<T> {
        if (error instanceof HTTPError) {
            const { status, statusText } = error.response;
            syncLogger.error('http:response:httpError', { provider: this.provider, status, statusText });

            if (status === HTTP_STATUS_UNAUTHORIZED || status === HTTP_STATUS_FORBIDDEN) {
                return this.failure(SyncError.unauthorized(this.provider));
            }

            if (status === HTTP_STATUS_TOO_MANY_REQUESTS) {
                return this.failure(SyncError.rateLimited(this.provider));
            }

            if (status === HTTP_STATUS_BAD_REQUEST) {
                return this.failure(SyncError.invalidResponse(this.provider));
            }

            return this.failure(new SyncError(SyncErrorCodeEnum.UNKNOWN, `HTTP ${status}: ${statusText}`, this.provider));
        }

        if (error instanceof TimeoutError) {
            syncLogger.error('http:response:timeout', { provider: this.provider });

            return this.failure(new SyncError(SyncErrorCodeEnum.NETWORK_ERROR, 'Request timeout', this.provider));
        }

        syncLogger.error('http:response:networkError', { provider: this.provider, error: getErrorMessage(error) });

        return this.failure(SyncError.networkError(this.provider, error));
    }

    abstract getClientInfo(): Promise<SyncResultInterface<SyncClientInfoInterface>>;
    abstract getAccounts(): Promise<SyncResultInterface<SyncAccountInterface[]>>;
    abstract getTransactions(accountId: string, from: number, to?: number): Promise<SyncResultInterface<SyncTransactionInterface[]>>;

    protected abstract getDefaultHeaders(): Record<string, string>;
}
