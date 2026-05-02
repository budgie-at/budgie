import { AccountTypeEnum, BankSyncModeEnum } from '@budgie/contracts';

import { seed } from './seed';
import { buildMonobankClientInfoWith } from './monobank-fixtures';
import { stubClientInfo } from './monobank-server';

interface MonobankFixtureInput {
    readonly externalId?: string;
    readonly mode?: BankSyncModeEnum;
    readonly forwardSyncFromAt?: Date;
}

export const setupMonobankFixture = (input: MonobankFixtureInput = {}) => {
    const externalId = input.externalId ?? 'mono-acc-1';
    const account = seed.account({ externalId, type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
    const bankSync = seed.bankSync({
        accountId: account.id,
        mode: input.mode ?? BankSyncModeEnum.FORWARD,
        forwardSyncFromAt: input.forwardSyncFromAt ?? new Date(2026, 0, 1)
    });
    stubClientInfo(buildMonobankClientInfoWith([externalId]));
    return { account, bankSync };
};
