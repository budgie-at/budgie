import ky, { HTTPError, TimeoutError } from 'ky';
import { z } from 'zod';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

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

const SyncProviderApiErrorSchema = z.object({
    code: z.union([z.string(), z.number()]).optional(),
    message: z.string().optional(),
    msg: z.string().optional()
});

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
        const loggedEndpoint = endpoint.replace(/([?&]signature=)[^&]*/u, '$1[REDACTED]');
        syncLogger.log('http:request', { provider: this.provider, endpoint: loggedEndpoint });
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
                endpoint: loggedEndpoint,
                isArray: Array.isArray(data),
                ...(Array.isArray(data) && { size: data.length })
            });

            return this.success(data);
        } catch (error) {
            return this.handleError<T>(error, loggedEndpoint);
        }
    }

    protected onResponseHeaders(_headers: Headers): void {
        return void 0;
    }

    // eslint-disable-next-line max-statements -- Instrumented with diagnostic logs (temporary)
    private async handleError<T>(caughtError: unknown, endpoint: string): Promise<SyncResultInterface<T>> {
        if (caughtError instanceof HTTPError) {
            const { status, statusText } = caughtError.response;
            const responseBody: unknown = caughtError.response.bodyUsed
                ? null
                : await caughtError.response
                      .clone()
                      .json()
                      .catch(() => null);
            const apiError = SyncProviderApiErrorSchema.safeParse(responseBody);
            syncLogger.error('http:response:httpError', {
                provider: this.provider,
                endpoint,
                status,
                statusText,
                ...(apiError.success && isDefined(apiError.data.code) && { apiCode: apiError.data.code }),
                ...(apiError.success && isDefined(apiError.data.message) && { apiMessage: apiError.data.message }),
                ...(apiError.success && isDefined(apiError.data.msg) && { apiMessage: apiError.data.msg })
            });

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

        if (caughtError instanceof TimeoutError) {
            syncLogger.error('http:response:timeout', { provider: this.provider, endpoint });

            return this.failure(new SyncError(SyncErrorCodeEnum.NETWORK_ERROR, 'Request timeout', this.provider));
        }

        syncLogger.error('http:response:networkError', { provider: this.provider, endpoint, error: getErrorMessage(caughtError) });

        return this.failure(SyncError.networkError(this.provider, caughtError));
    }

    abstract getClientInfo(): Promise<SyncResultInterface<SyncClientInfoInterface>>;
    abstract getAccounts(): Promise<SyncResultInterface<SyncAccountInterface[]>>;
    abstract getTransactions(accountId: string, from: number, to?: number): Promise<SyncResultInterface<SyncTransactionInterface[]>>;

    protected abstract getDefaultHeaders(): Record<string, string>;
}
