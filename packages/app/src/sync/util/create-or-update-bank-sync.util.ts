import { BankSyncModeEnum, BankSyncStatusEnum, ExternalSourceEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { bankSyncRepository } from '../../@generic/drizzle/db/db';
import { transactionService } from '../../transaction/service/transaction.service';

export const createOrUpdateBankSync = async (accountId: number, token: string, provider: ExternalSourceEnum): Promise<void> => {
    const existingSync = await bankSyncRepository.getByAccountId(accountId);
    if (isDefined(existingSync)) {
        await bankSyncRepository.update(existingSync.id, { token, enabled: true, errorCount: 0, lastError: null });

        return;
    }

    const now = new Date();
    const earliestTransactionTime = await transactionService.getEarliestTransactionTimeByAccountId(accountId);
    await bankSyncRepository.create({
        token,
        accountId,
        provider,
        enabled: true,
        mode: BankSyncModeEnum.BACKWARD,
        status: BankSyncStatusEnum.SYNCING,
        backwardSyncFromAt: now,
        backwardSyncedAt: earliestTransactionTime ?? null,
        forwardSyncFromAt: now,
        forwardSyncedAt: null
    });
};
