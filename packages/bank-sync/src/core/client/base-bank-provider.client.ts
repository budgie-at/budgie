import { BankSyncErrorCodeEnum } from '../enum/bank-sync-error-code.enum';
import { BankSyncError } from '../error/bank-sync.error';

import type { BankProviderEnum } from '../enum/bank-provider.enum';
import type { BankAccountInterface } from '../interface/bank-account.interface';
import type { BankClientInfoInterface } from '../interface/bank-client-info.interface';
import type { BankProviderClientInterface } from '../interface/bank-provider-client.interface';
import type { BankSyncResultInterface } from '../interface/bank-sync-result.interface';
import type { BankTransactionInterface } from '../interface/bank-transaction.interface';

const HTTP_STATUS_UNAUTHORIZED = 401;
const HTTP_STATUS_TOO_MANY_REQUESTS = 429;

export abstract class BaseBankProviderClient implements BankProviderClientInterface {
    protected readonly token: string;
    protected abstract readonly provider: BankProviderEnum;
    protected abstract readonly baseUrl: string;

    constructor(token: string) {
        this.token = token;
    }

    protected success<T>(data: T): BankSyncResultInterface<T> {
        return { success: true, data };
    }

    protected failure<T>(error: BankSyncError): BankSyncResultInterface<T> {
        return { success: false, error };
    }

    protected async fetchJson<T>(endpoint: string, options?: RequestInit): Promise<BankSyncResultInterface<T>> {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers: {
                    ...this.getDefaultHeaders(),
                    // eslint-disable-next-line @typescript-eslint/no-misused-spread
                    ...options?.headers
                }
            });

            if (response.status === HTTP_STATUS_UNAUTHORIZED) {
                return this.failure(BankSyncError.unauthorized(this.provider));
            }

            if (response.status === HTTP_STATUS_TOO_MANY_REQUESTS) {
                return this.failure(BankSyncError.rateLimited(this.provider));
            }

            if (!response.ok) {
                return this.failure(
                    new BankSyncError(BankSyncErrorCodeEnum.UNKNOWN, `HTTP ${response.status}: ${response.statusText}`, this.provider)
                );
            }

            const data = (await response.json()) as T;

            return this.success(data);
        } catch (error) {
            return this.failure(BankSyncError.networkError(this.provider, error));
        }
    }

    abstract getClientInfo(): Promise<BankSyncResultInterface<BankClientInfoInterface>>;
    abstract getAccounts(): Promise<BankSyncResultInterface<BankAccountInterface[]>>;
    abstract getTransactions(accountId: string, from: number, to?: number): Promise<BankSyncResultInterface<BankTransactionInterface[]>>;

    protected abstract getDefaultHeaders(): Record<string, string>;
}
