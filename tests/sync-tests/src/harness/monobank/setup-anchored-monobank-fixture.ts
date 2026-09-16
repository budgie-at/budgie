import {
    AccountBalanceEntityTable,
    AccountTypeEnum,
    ExternalSourceEnum,
    SyncBalanceAuthorityEnum,
    SyncModeEnum,
    SyncStatusEnum
} from '@budgie/contracts';

import { insertOne } from '../db/insert-one';
import { seed } from '../seed/seed';

export const setupAnchoredMonobankFixture = (mode = SyncModeEnum.FORWARD) => {
    const externalId = 'mono-anchored';
    const anchorCapturedAt = new Date(Date.now() - 10 * 60 * 1000);
    const backwardSweepStartedAt = new Date();
    const backwardSyncFromAt = new Date(backwardSweepStartedAt);
    backwardSyncFromAt.setMonth(backwardSyncFromAt.getMonth() - 3);
    const account = seed.account({
        externalId,
        externalSource: ExternalSourceEnum.MONOBANK,
        type: AccountTypeEnum.BANK_SYNC,
        instrumentId: 1
    });
    const sync = seed.sync({
        accountId: account.id,
        mode,
        status: SyncStatusEnum.IDLE,
        backwardSyncFromAt: mode === SyncModeEnum.BACKWARD ? backwardSyncFromAt : null,
        backwardSyncedAt: mode === SyncModeEnum.BACKWARD ? backwardSweepStartedAt : null,
        forwardSyncFromAt: anchorCapturedAt,
        balanceAuthority: SyncBalanceAuthorityEnum.PROVIDER,
        balanceAnchorCapturedAt: anchorCapturedAt
    });
    insertOne(AccountBalanceEntityTable, { accountId: account.id, amount: 500_000, updatedAt: anchorCapturedAt });

    return { account, anchorCapturedAt, externalId, sync };
};
