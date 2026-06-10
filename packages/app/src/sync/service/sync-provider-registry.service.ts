import { ExternalSourceEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { syncRepository } from '../../@generic/drizzle/db/db';

import { AbstractSyncService } from './abstract-sync.service';
import { binanceSyncService } from './binance-sync.service';
import { ersteSyncService } from './erste-sync.service';
import { monobankSyncService } from './monobank-sync.service';
import { privatbankSyncService } from './privatbank-sync.service';

const SERVICE_MAP = new Map<ExternalSourceEnum, AbstractSyncService>([
    [ExternalSourceEnum.MONOBANK, monobankSyncService],
    [ExternalSourceEnum.BINANCE, binanceSyncService],
    [ExternalSourceEnum.ERSTE, ersteSyncService],
    [ExternalSourceEnum.PRIVATBANK, privatbankSyncService]
]);

class SyncProviderRegistryService {
    @Log(
        accountId => `enter accountId=${accountId}`,
        (result, accountId) => `done accountId=${accountId} provider=${result?.constructor.name ?? 'null'}`,
        (error, accountId) => `throw accountId=${accountId} error=${getErrorMessage(error)}`
    )
    async getServiceForAccount(accountId: number): Promise<AbstractSyncService | null> {
        const sync = await syncRepository.getByAccountId(accountId);
        if (!isDefined(sync)) {
            return null;
        }

        return this.getServiceForProvider(sync.provider);
    }

    getServiceForProvider(provider: ExternalSourceEnum): AbstractSyncService | null {
        return SERVICE_MAP.get(provider) ?? null;
    }
}

export const syncProviderRegistryService = new SyncProviderRegistryService();
