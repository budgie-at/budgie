import ky, { HTTPError, TimeoutError } from 'ky';

import { getErrorMessage } from '@rnw-community/shared';

import { BankSyncErrorCodeEnum } from '../enum/bank-sync-error-code.enum';
import { BankSyncError } from '../error/bank-sync.error';
import { syncLogger } from '../util/sync-logger.util';

import type { BankProviderEnum } from '../enum/bank-provider.enum';
import type { BankAccountInterface } from '../interface/bank-account.interface';
import type { BankClientInfoInterface } from '../interface/bank-client-info.interface';
import type { BankProviderClientInterface } from '../interface/bank-provider-client.interface';
import type { BankSyncResultInterface } from '../interface/bank-sync-result.type';
import type { BankTransactionInterface } from '../interface/bank-transaction.interface';

const HTTP_STATUS_BAD_REQUEST = 400;

const HTTP_STATUS_UNAUTHORIZED = 401;
const HTTP_STATUS_REQUEST_TIMEOUT = 408;
const HTTP_STATUS_TOO_MANY_REQUESTS = 429;
const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;
const HTTP_STATUS_BAD_GATEWAY = 502;
const HTTP_STATUS_SERVICE_UNAVAILABLE = 503;
const HTTP_STATUS_GATEWAY_TIMEOUT = 504;

const DEFAULT_RETRY_STATUS_CODES = [
    HTTP_STATUS_REQUEST_TIMEOUT,
    HTTP_STATUS_INTERNAL_SERVER_ERROR,
    HTTP_STATUS_BAD_GATEWAY,
    HTTP_STATUS_SERVICE_UNAVAILABLE,
    HTTP_STATUS_GATEWAY_TIMEOUT
];

const DEFAULT_RETRY_LIMIT = 3;
const DEFAULT_TIMEOUT_MS = 30000;

export abstract class BaseBankProviderClient implements BankProviderClientInterface {
    protected readonly retryLimit: number;
    protected readonly timeoutMs: number;
    protected readonly retryStatusCodes: number[];

    protected abstract readonly provider: BankProviderEnum;
    protected abstract readonly baseUrl: string;

    constructor(
        protected readonly token: string,
        options?: {
            readonly retryLimit?: number;
            readonly timeoutMs?: number;
            readonly retryStatusCodes?: number[];
        }
    ) {
        this.retryLimit = options?.retryLimit ?? DEFAULT_RETRY_LIMIT;
        this.timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
        this.retryStatusCodes = options?.retryStatusCodes ?? DEFAULT_RETRY_STATUS_CODES;
    }

    protected success<T>(data: T): BankSyncResultInterface<T> {
        return { success: true, data };
    }

    protected failure<T>(error: BankSyncError): BankSyncResultInterface<T> {
        return { success: false, error };
    }

    protected async fetchJson<T>(endpoint: string, options?: RequestInit): Promise<BankSyncResultInterface<T>> {
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
                    methods: ['get'],
                    statusCodes: this.retryStatusCodes
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

    // eslint-disable-next-line max-statements -- Instrumented with diagnostic logs (temporary)
    private handleError<T>(error: unknown): BankSyncResultInterface<T> {
        if (error instanceof HTTPError) {
            const { status, statusText } = error.response;
            syncLogger.error('http:response:httpError', { provider: this.provider, status, statusText });

            if (status === HTTP_STATUS_UNAUTHORIZED) {
                return this.failure(BankSyncError.unauthorized(this.provider));
            }

            if (status === HTTP_STATUS_TOO_MANY_REQUESTS) {
                return this.failure(BankSyncError.rateLimited(this.provider));
            }

            if (status === HTTP_STATUS_BAD_REQUEST) {
                return this.failure(BankSyncError.invalidResponse(this.provider));
            }

            return this.failure(new BankSyncError(BankSyncErrorCodeEnum.UNKNOWN, `HTTP ${status}: ${statusText}`, this.provider));
        }

        if (error instanceof TimeoutError) {
            syncLogger.error('http:response:timeout', { provider: this.provider });

            return this.failure(new BankSyncError(BankSyncErrorCodeEnum.NETWORK_ERROR, 'Request timeout', this.provider));
        }

        syncLogger.error('http:response:networkError', { provider: this.provider, error: getErrorMessage(error) });

        return this.failure(BankSyncError.networkError(this.provider, error));
    }

    abstract getClientInfo(): Promise<BankSyncResultInterface<BankClientInfoInterface>>;
    abstract getAccounts(): Promise<BankSyncResultInterface<BankAccountInterface[]>>;
    abstract getTransactions(accountId: string, from: number, to?: number): Promise<BankSyncResultInterface<BankTransactionInterface[]>>;

    protected abstract getDefaultHeaders(): Record<string, string>;
}
