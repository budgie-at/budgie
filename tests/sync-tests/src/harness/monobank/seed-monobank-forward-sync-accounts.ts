import { AccountTypeEnum, ExternalSourceEnum, SyncModeEnum } from '@budgie/contracts';

import { seed } from '../seed/seed';

export const seedMonobankForwardSyncAccounts = (externalIds: readonly string[], forwardSyncFromAt: Date): void => {
    for (const externalId of externalIds) {
        const account = seed.account({ externalId, externalSource: ExternalSourceEnum.MONOBANK, type: AccountTypeEnum.BANK_SYNC });
        seed.sync({
            accountId: account.id,
            forwardSyncFromAt,
            mode: SyncModeEnum.FORWARD,
            provider: ExternalSourceEnum.MONOBANK
        });
    }
};
