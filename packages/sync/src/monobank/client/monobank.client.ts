import { getUnixTime } from 'date-fns';

import { isDefined } from '@rnw-community/shared';

import { BaseSyncProviderClient } from '../../core/client/base-sync-provider.client';
import { SyncProviderEnum } from '../../core/enum/sync-provider.enum';
import { MONOBANK_API_BASE_URL } from '../constant/monobank-api-base-url.constant';
import { monobankAccountMapper } from '../mapper/monobank-account.mapper';
import { monobankJarMapper } from '../mapper/monobank-jar.mapper';
import { monobankTransactionMapper } from '../mapper/monobank-transaction.mapper';

import type { SyncAccountInterface } from '../../core/interface/sync-account.interface';
import type { SyncClientInfoInterface } from '../../core/interface/sync-client-info.interface';
import type { SyncResultInterface } from '../../core/interface/sync-result.type';
import type { SyncTransactionInterface } from '../../core/interface/sync-transaction.interface';
import type { MonobankClientInfoApiInterface } from '../interface/monobank-client-info-api.interface';
import type { MonobankTransactionApiInterface } from '../interface/monobank-transaction-api.type';

export class MonobankClient extends BaseSyncProviderClient {
    protected readonly provider = SyncProviderEnum.MONOBANK;
    protected readonly baseUrl = MONOBANK_API_BASE_URL;
    private cachedClientInfo: MonobankClientInfoApiInterface | undefined;

    async getClientInfo(): Promise<SyncResultInterface<SyncClientInfoInterface>> {
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

    async getAccounts(): Promise<SyncResultInterface<SyncAccountInterface[]>> {
        const result = await this.fetchClientInfoApi();

        if (!result.success) {
            return result;
        }

        const accounts = result.data.accounts.map(monobankAccountMapper);

        return this.success(accounts);
    }

    async getJars(): Promise<SyncResultInterface<SyncAccountInterface[]>> {
        const result = await this.fetchClientInfoApi();

        if (!result.success) {
            return result;
        }

        const jars = result.data.jars.map(monobankJarMapper);

        return this.success(jars);
    }

    async getTransactions(accountId: string, from: number, to?: number): Promise<SyncResultInterface<SyncTransactionInterface[]>> {
        const toTimestamp = to ?? getUnixTime(new Date());
        const endpoint = `/personal/statement/${accountId}/${from}/${toTimestamp}`;
        const result = await this.fetchJson<MonobankTransactionApiInterface[]>(endpoint);

        if (!result.success) {
            return result;
        }

        const transactions = result.data.map(tx => monobankTransactionMapper(tx, accountId));

        return this.success(transactions);
    }

    async setWebhook(url: string): Promise<SyncResultInterface<void>> {
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

    private async fetchClientInfoApi(): Promise<SyncResultInterface<MonobankClientInfoApiInterface>> {
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
