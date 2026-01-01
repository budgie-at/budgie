import { BankSyncStatusEnum, ExternalSourceEnum } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { bankSyncRepository } from '../../@generic/drizzle/db/db';
import { BankSyncStatsInterface, emptyBankSyncStats } from '../interface/bank-sync-stats.interface';

export const useBankSyncState = (provider: ExternalSourceEnum): BankSyncStatsInterface => {
    const { data } = useLiveQuery(bankSyncRepository.findByProvider(provider), [provider]);

    if (!isDefined(data)) {
        return emptyBankSyncStats;
    }

    const totalTransactions = data.reduce((sum, sync) => sum + sync.transactionCount, 0);
    const hasSyncing = data.some(sync => sync.status === BankSyncStatusEnum.SYNCING);
    const hasFailed = data.some(sync => sync.status === BankSyncStatusEnum.FAILED);

    return {
        // eslint-disable-next-line no-nested-ternary
        status: hasSyncing ? 'loading' : hasFailed ? 'failed' : 'idle',
        totalAccounts: data.length,
        totalTransactions,
        syncs: data,
        isLoading: false
    };
};
