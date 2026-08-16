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

import { BankProviderEnum } from '../../core/enum/bank-provider.enum';
import { BankSyncErrorCodeEnum } from '../../core/enum/bank-sync-error-code.enum';
import { BankSyncError } from '../../core/error/bank-sync.error';
import { monobankAccountMapper } from '../mapper/monobank-account.mapper';
import { monobankJarMapper } from '../mapper/monobank-jar.mapper';
import { monobankTransactionMapper } from '../mapper/monobank-transaction.mapper';

import type { BankAccountInterface } from '../../core/interface/bank-account.interface';
import type { BankClientInfoInterface } from '../../core/interface/bank-client-info.interface';
import type { BankProviderClientInterface } from '../../core/interface/bank-provider-client.interface';
import type { BankSyncResultInterface } from '../../core/interface/bank-sync-result.type';
import type { BankTransactionInterface } from '../../core/interface/bank-transaction.interface';
import type { ClientInfo } from '@liaugust/monobank-sdk';

const HTTP_STATUS_BAD_REQUEST = 400;
const HTTP_STATUS_UNAUTHORIZED = 401;
const HTTP_STATUS_TOO_MANY_REQUESTS = 429;

export class MonobankClient implements BankProviderClientInterface {
    private static readonly TIMEOUT_MS = 30_000;

    private readonly personalClient: MonobankPersonalClient;
    private cachedClientInfo: ClientInfo | undefined;

    constructor(token: string) {
        this.personalClient = new MonobankPersonalClient({ timeoutMs: MonobankClient.TIMEOUT_MS, token });
    }

    @Log('enter', result => `done success=${String(result.success)}`, error => `throw error=${getErrorMessage(error)}`)
    async getClientInfo(): Promise<BankSyncResultInterface<BankClientInfoInterface>> {
        const result = await this.fetchClientInfo();

        if (!result.success) {
            return result;
        }

        return {
            success: true,
            data: {
                id: result.data.clientId,
                name: result.data.name,
                provider: BankProviderEnum.MONOBANK,
                webHookUrl: result.data.webHookUrl,
                permissions: result.data.permissions
            }
        };
    }

    @Log('enter', result => `done success=${String(result.success)}`, error => `throw error=${getErrorMessage(error)}`)
    async getAccounts(): Promise<BankSyncResultInterface<BankAccountInterface[]>> {
        const result = await this.fetchClientInfo();

        if (!result.success) {
            return result;
        }

        return { success: true, data: result.data.accounts.map(monobankAccountMapper) };
    }

    @Log('enter', result => `done success=${String(result.success)}`, error => `throw error=${getErrorMessage(error)}`)
    async getJars(): Promise<BankSyncResultInterface<BankAccountInterface[]>> {
        const result = await this.fetchClientInfo();

        if (!result.success) {
            return result;
        }

        return { success: true, data: result.data.jars.map(monobankJarMapper) };
    }

    @Log(
        (accountId, from, to) => `enter accountId=${accountId} from=${from} to=${to ?? 'now'}`,
        (result, accountId, from, to) =>
            `done accountId=${accountId} from=${from} to=${to ?? 'now'} success=${String(result.success)} count=${result.success ? result.data.length : 0}`,
        (error, accountId, from, to) => `throw accountId=${accountId} from=${from} to=${to ?? 'now'} error=${getErrorMessage(error)}`
    )
    async getTransactions(accountId: string, from: number, to?: number): Promise<BankSyncResultInterface<BankTransactionInterface[]>> {
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
    async setWebhook(url: string): Promise<BankSyncResultInterface<void>> {
        try {
            await this.personalClient.webhooks.set({ webHookUrl: url });

            return { success: true, data: void 0 };
        } catch (error) {
            return this.toFailure(error);
        }
    }

    private async fetchClientInfo(): Promise<BankSyncResultInterface<ClientInfo>> {
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

    private toFailure<T>(error: unknown): BankSyncResultInterface<T> {
        if (error instanceof MonobankApiError) {
            return { success: false, error: this.toApiFailureError(error) };
        }

        if (error instanceof MonobankNetworkError) {
            return {
                success: false,
                error: new BankSyncError(BankSyncErrorCodeEnum.NETWORK_ERROR, error.message, BankProviderEnum.MONOBANK, error)
            };
        }

        if (error instanceof MonobankResponseValidationError) {
            return { success: false, error: BankSyncError.invalidResponse(BankProviderEnum.MONOBANK, error) };
        }

        if (error instanceof MonobankValidationError) {
            return {
                success: false,
                error: new BankSyncError(BankSyncErrorCodeEnum.UNKNOWN, error.issues.join('; '), BankProviderEnum.MONOBANK, error)
            };
        }

        return { success: false, error: BankSyncError.networkError(BankProviderEnum.MONOBANK, error) };
    }

    private toApiFailureError(error: MonobankApiError): BankSyncError {
        if (error.status === HTTP_STATUS_UNAUTHORIZED) {
            return BankSyncError.unauthorized(BankProviderEnum.MONOBANK, error);
        }

        if (error.status === HTTP_STATUS_TOO_MANY_REQUESTS) {
            return BankSyncError.rateLimited(BankProviderEnum.MONOBANK, error);
        }

        if (error.status === HTTP_STATUS_BAD_REQUEST) {
            return BankSyncError.invalidResponse(BankProviderEnum.MONOBANK, error);
        }

        return new BankSyncError(
            BankSyncErrorCodeEnum.UNKNOWN,
            `HTTP ${String(error.status)}: ${error.message}`,
            BankProviderEnum.MONOBANK,
            error
        );
    }
}
