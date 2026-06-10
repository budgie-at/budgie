import { AccountTypeEnum, SyncModeEnum } from '@budgie/contracts';

import { seed } from '../seed/seed';
import { buildMonobank } from './build-monobank';
import { monobankStub } from './monobank-stub';

export const setupMonobankFixture = (
    externalId: string = 'mono-acc-1',
    mode: SyncModeEnum = SyncModeEnum.FORWARD,
    forwardSyncFromAt: Date = new Date(2026, 0, 1)
) => {
    const account = seed.account({ externalId, type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
    const sync = seed.sync({ accountId: account.id, mode, forwardSyncFromAt });
    monobankStub.clientInfo(buildMonobank.clientInfoWith([externalId]));
    return { account, sync };
};
