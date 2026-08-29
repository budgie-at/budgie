import { Log } from '@budgie/logger';
import {
    MonobankApiError,
    MonobankNetworkError,
    MonobankPersonalClient,
    MonobankResponseValidationError,
    MonobankValidationError
} from '@liaugust/monobank-sdk';
import { getUnixTime } from 'date-fns';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { SyncErrorCodeEnum } from '../../core/enum/sync-error-code.enum';
import { SyncProviderEnum } from '../../core/enum/sync-provider.enum';
import { SyncError } from '../../core/error/sync.error';
import { monobankAccountMapper } from '../mapper/monobank-account.mapper';
import { monobankJarMapper } from '../mapper/monobank-jar.mapper';
import { monobankTransactionMapper } from '../mapper/monobank-transaction.mapper';

import type { SyncAccountInterface } from '../../core/interface/sync-account.interface';
import type { SyncClientInfoInterface } from '../../core/interface/sync-client-info.interface';
import type { SyncProviderClientInterface } from '../../core/interface/sync-provider-client.interface';
import type { SyncResultInterface } from '../../core/interface/sync-result.type';
import type { SyncTransactionInterface } from '../../core/interface/sync-transaction.interface';
import type { ClientInfo } from '@liaugust/monobank-sdk';

const HTTP_STATUS_BAD_REQUEST = 400;
const HTTP_STATUS_UNAUTHORIZED = 401;
const HTTP_STATUS_REQUEST_TIMEOUT = 408;
const HTTP_STATUS_TOO_MANY_REQUESTS = 429;
const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;
const HTTP_STATUS_BAD_GATEWAY = 502;
const HTTP_STATUS_SERVICE_UNAVAILABLE = 503;
const HTTP_STATUS_GATEWAY_TIMEOUT = 504;

export class MonobankClient implements SyncProviderClientInterface {
    private static readonly TIMEOUT_MS = 30_000;
    private static readonly RETRY_BASE_DELAY_MS = 300;
    private static readonly RETRY_MAX_ATTEMPTS = 4;
    private static readonly RETRY_MAX_DELAY_MS = 2_000;
    private static readonly RETRYABLE_STATUS_CODES = [
        HTTP_STATUS_REQUEST_TIMEOUT,
        HTTP_STATUS_INTERNAL_SERVER_ERROR,
        HTTP_STATUS_BAD_GATEWAY,
        HTTP_STATUS_SERVICE_UNAVAILABLE,
        HTTP_STATUS_GATEWAY_TIMEOUT
    ];

    private readonly personalClient: MonobankPersonalClient;
    private cachedClientInfo: ClientInfo | undefined;

    constructor(token: string) {
        this.personalClient = new MonobankPersonalClient({
            retry: {
                baseDelayMs: MonobankClient.RETRY_BASE_DELAY_MS,
                maxAttempts: MonobankClient.RETRY_MAX_ATTEMPTS,
                maxDelayMs: MonobankClient.RETRY_MAX_DELAY_MS,
                retryableStatusCodes: MonobankClient.RETRYABLE_STATUS_CODES
            },
            timeoutMs: MonobankClient.TIMEOUT_MS,
            token
        });
    }

    @Log('enter', result => `done success=${String(result.success)}`, error => `throw error=${getErrorMessage(error)}`)
    async getClientInfo(): Promise<SyncResultInterface<SyncClientInfoInterface>> {
        const result = await this.fetchClientInfo();

        if (!result.success) {
            return result;
        }

        return {
            success: true,
            data: {
                id: result.data.clientId,
                name: result.data.name,
                provider: SyncProviderEnum.MONOBANK,
                webHookUrl: result.data.webHookUrl,
                permissions: result.data.permissions
            }
        };
    }

    @Log('enter', result => `done success=${String(result.success)}`, error => `throw error=${getErrorMessage(error)}`)
    async getAccounts(): Promise<SyncResultInterface<SyncAccountInterface[]>> {
        const result = await this.fetchClientInfo();

        if (!result.success) {
            return result;
        }

        return { success: true, data: result.data.accounts.map(monobankAccountMapper) };
    }

    @Log('enter', result => `done success=${String(result.success)}`, error => `throw error=${getErrorMessage(error)}`)
    async getJars(): Promise<SyncResultInterface<SyncAccountInterface[]>> {
        const result = await this.fetchClientInfo();

        if (!result.success) {
            return result;
        }

        return { success: true, data: (result.data.jars ?? []).map(monobankJarMapper) };
    }

    @Log(
        (accountId, from, to) => `enter accountId=${accountId} from=${from} to=${to ?? 'now'}`,
        (result, accountId, from, to) =>
            `done accountId=${accountId} from=${from} to=${to ?? 'now'} success=${String(result.success)} count=${result.success ? result.data.length : 0}`,
        (error, accountId, from, to) => `throw accountId=${accountId} from=${from} to=${to ?? 'now'} error=${getErrorMessage(error)}`
    )
    async getTransactions(accountId: string, from: number, to?: number): Promise<SyncResultInterface<SyncTransactionInterface[]>> {
        try {
            const statements = await this.personalClient.statements.get({ account: accountId, from, to: to ?? getUnixTime(new Date()) });

            return { success: true, data: statements.map(statement => monobankTransactionMapper(statement, accountId)) };
        } catch (error) {
            return this.toFailure(error);
        }
    }

    @Log(
        url => `enter url="${url}"`,
        (result, url) => `done url="${url}" success=${String(result.success)}`,
        (error, url) => `throw url="${url}" error=${getErrorMessage(error)}`
    )
    async setWebhook(url: string): Promise<SyncResultInterface<void>> {
        try {
            await this.personalClient.webhooks.set({ webHookUrl: url });

            return { success: true, data: void 0 };
        } catch (error) {
            return this.toFailure(error);
        }
    }

    private async fetchClientInfo(): Promise<SyncResultInterface<ClientInfo>> {
        if (isDefined(this.cachedClientInfo)) {
            return { success: true, data: this.cachedClientInfo };
        }

        try {
            const clientInfo = await this.personalClient.client.getInfo();
            this.cachedClientInfo = clientInfo;

            return { success: true, data: clientInfo };
        } catch (error) {
            return this.toFailure(error);
        }
    }

    private toFailure<T>(error: unknown): SyncResultInterface<T> {
        if (error instanceof MonobankApiError) {
            return { success: false, error: this.toApiFailureError(error) };
        }

        if (error instanceof MonobankNetworkError) {
            return {
                success: false,
                error: new SyncError(SyncErrorCodeEnum.NETWORK_ERROR, error.message, SyncProviderEnum.MONOBANK, error)
            };
        }

        if (error instanceof MonobankResponseValidationError) {
            return { success: false, error: SyncError.invalidResponse(SyncProviderEnum.MONOBANK, error) };
        }

        if (error instanceof MonobankValidationError) {
            return {
                success: false,
                error: new SyncError(SyncErrorCodeEnum.UNKNOWN, error.issues.join('; '), SyncProviderEnum.MONOBANK, error)
            };
        }

        return { success: false, error: SyncError.networkError(SyncProviderEnum.MONOBANK, error) };
    }

    private toApiFailureError(error: MonobankApiError): SyncError {
        switch (error.status) {
            case HTTP_STATUS_UNAUTHORIZED:
                return SyncError.unauthorized(SyncProviderEnum.MONOBANK, error);
            case HTTP_STATUS_TOO_MANY_REQUESTS:
                return SyncError.rateLimited(SyncProviderEnum.MONOBANK, error);
            case HTTP_STATUS_BAD_REQUEST:
                return SyncError.invalidResponse(SyncProviderEnum.MONOBANK, error);
            default:
                return new SyncError(
                    SyncErrorCodeEnum.UNKNOWN,
                    `HTTP ${String(error.status)}: ${error.message}`,
                    SyncProviderEnum.MONOBANK,
                    error
                );
        }
    }
}
