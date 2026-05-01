import { isDefined } from '@rnw-community/shared';

import { BaseBankProviderClient } from '../../core/client/base-bank-provider.client';
import { BankProviderEnum } from '../../core/enum/bank-provider.enum';
import { syncLogger } from '../../core/util/sync-logger.util';
import { MONOBANK_API_BASE_URL } from '../constant/monobank-api-base-url.constant';
import { monobankAccountMapper } from '../mapper/monobank-account.mapper';
import { monobankTransactionMapper } from '../mapper/monobank-transaction.mapper';

import type { BankAccountInterface } from '../../core/interface/bank-account.interface';
import type { BankClientInfoInterface } from '../../core/interface/bank-client-info.interface';
import type { BankSyncResultInterface } from '../../core/interface/bank-sync-result.type';
import type { BankTransactionInterface } from '../../core/interface/bank-transaction.interface';
import type { MonobankClientInfoApiInterface } from '../interface/monobank-client-info-api.interface';
import type { MonobankTransactionApiInterface } from '../interface/monobank-transaction-api.type';

export class MonobankClient extends BaseBankProviderClient {
    protected readonly provider = BankProviderEnum.MONOBANK;
    protected readonly baseUrl = MONOBANK_API_BASE_URL;
    private cachedClientInfo: MonobankClientInfoApiInterface | undefined;

    async getClientInfo(): Promise<BankSyncResultInterface<BankClientInfoInterface>> {
        const result = await this.fetchClientInfoApi();

        if (!result.success) {
            return result;
        }

        return this.success({
            id: result.data.clientId,
            name: result.data.name,
            provider: this.provider,
            webHookUrl: result.data.webHookUrl,
            permissions: result.data.permissions
        });
    }

    async getAccounts(): Promise<BankSyncResultInterface<BankAccountInterface[]>> {
        const result = await this.fetchClientInfoApi();

        if (!result.success) {
            return result;
        }

        const accounts = result.data.accounts.map(monobankAccountMapper);

        return this.success(accounts);
    }

    async getTransactions(accountId: string, from: number, to?: number): Promise<BankSyncResultInterface<BankTransactionInterface[]>> {
        const toTimestamp = to ?? Math.floor(Date.now() / 1000);
        const endpoint = `/personal/statement/${accountId}/${from}/${toTimestamp}`;

        syncLogger.log('monobank:getTransactions:request', { accountId, from, toTimestamp, endpoint });
        const result = await this.fetchJson<MonobankTransactionApiInterface[]>(endpoint);

        if (!result.success) {
            syncLogger.error('monobank:getTransactions:error', { accountId, code: result.error.code, message: result.error.message });

            return result;
        }

        const transactions = result.data.map(tx => monobankTransactionMapper(tx, accountId));
        syncLogger.log('monobank:getTransactions:mapped', {
            accountId,
            rawCount: result.data.length,
            mappedCount: transactions.length,
            firstRawTime: result.data[0]?.time,
            lastRawTime: result.data[result.data.length - 1]?.time,
            anyHold: result.data.some(tx => tx.hold)
        });

        return this.success(transactions);
    }

    async setWebhook(url: string): Promise<BankSyncResultInterface<void>> {
        const result = await this.fetchJson<Record<string, never>>('/personal/webhook', {
            method: 'POST',
            body: JSON.stringify({ webHookUrl: url })
        });

        if (!result.success) {
            return result;
        }

        return this.success(void 0);
    }

    protected getDefaultHeaders(): Record<string, string> {
        return {
            'X-Token': this.token,
            'Content-Type': 'application/json'
        };
    }

    private async fetchClientInfoApi(): Promise<BankSyncResultInterface<MonobankClientInfoApiInterface>> {
        if (isDefined(this.cachedClientInfo)) {
            return this.success(this.cachedClientInfo);
        }

        const result = await this.fetchJson<MonobankClientInfoApiInterface>('/personal/client-info');

        if (result.success) {
            this.cachedClientInfo = result.data;
        }

        return result;
    }
}
