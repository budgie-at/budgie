import { AccountTypeEnum, BankSyncModeEnum } from '@budgie/contracts';

import { seed } from '../seed/seed';
import { buildMonobankClientInfoWith } from './monobank-fixtures';
import { stubClientInfo } from './monobank-server';

export const setupMonobankFixture = (
    externalId: string = 'mono-acc-1',
    mode: BankSyncModeEnum = BankSyncModeEnum.FORWARD,
    forwardSyncFromAt: Date = new Date(2026, 0, 1)
) => {
    const account = seed.account({ externalId, type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
    const bankSync = seed.bankSync({ accountId: account.id, mode, forwardSyncFromAt });
    stubClientInfo(buildMonobankClientInfoWith([externalId]));
    return { account, bankSync };
};
