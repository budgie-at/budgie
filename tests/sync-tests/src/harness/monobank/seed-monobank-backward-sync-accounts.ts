import { AccountTypeEnum, ExternalSourceEnum, SyncModeEnum } from '@budgie/contracts';

import { seed } from '../seed/seed';

export const seedMonobankBackwardSyncAccounts = (externalIds: readonly string[]): void => {
    const backwardSyncFromAt = new Date();

    for (const externalId of externalIds) {
        const account = seed.account({ externalId, externalSource: ExternalSourceEnum.MONOBANK, type: AccountTypeEnum.BANK_SYNC });
        seed.sync({
            accountId: account.id,
            backwardSyncFromAt,
            backwardSyncedAt: null,
            mode: SyncModeEnum.BACKWARD,
            provider: ExternalSourceEnum.MONOBANK
        });
    }
};
