import { ExternalSourceEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { syncRepository } from '../../@generic/drizzle/db/db';
import { BankIntegrationCapabilitiesInterface } from '../interface/bank-integration-capabilities.interface';

import { AbstractSyncService } from './abstract-sync.service';
import { binanceSyncService } from './binance-sync.service';
import { ersteSyncService } from './erste-sync.service';
import { monobankSyncService } from './monobank-sync.service';
import { privatbankSyncService } from './privatbank-sync.service';

import type { BankIntegrationEntityInterface } from '@budgie/contracts';

const SERVICE_MAP = new Map<ExternalSourceEnum, AbstractSyncService>([
    [ExternalSourceEnum.MONOBANK, monobankSyncService],
    [ExternalSourceEnum.BINANCE, binanceSyncService],
    [ExternalSourceEnum.ERSTE, ersteSyncService],
    [ExternalSourceEnum.PRIVATBANK, privatbankSyncService]
]);

class SyncProviderRegistryService {
    private static readonly PROVIDER_SUPPORTS_DEPOSIT: Record<ExternalSourceEnum, boolean> = {
        [ExternalSourceEnum.MANUAL]: false,
        [ExternalSourceEnum.MONOBANK]: true,
        [ExternalSourceEnum.PRIVATBANK]: true,
        [ExternalSourceEnum.ERSTE]: true,
        [ExternalSourceEnum.REVOLUT]: true,
        [ExternalSourceEnum.WISE]: true,
        [ExternalSourceEnum.CSV]: true,
        [ExternalSourceEnum.BINANCE]: false,
        [ExternalSourceEnum.COINBASE]: false
    };

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

    getCapabilities(integration: Pick<BankIntegrationEntityInterface, 'provider' | 'token'>): BankIntegrationCapabilitiesInterface {
        const service = this.getServiceForProvider(integration.provider);
        const hasToken = isNotEmptyString(integration.token);
        const supportsDeposit = SyncProviderRegistryService.PROVIDER_SUPPORTS_DEPOSIT[integration.provider];

        if (!isDefined(service)) {
            return { supportsLiveSync: false, supportsFileImport: false, supportsAddAccounts: false, supportsDeposit };
        }

        const supportsLiveSync = hasToken && service.supportsTokenAuth;

        return {
            supportsLiveSync,
            supportsFileImport: !hasToken && service.supportsFileImport,
            supportsAddAccounts: supportsLiveSync && service.supportsAddAccounts,
            supportsDeposit
        };
    }
}

export const syncProviderRegistryService = new SyncProviderRegistryService();
