import { seed } from './seed';
import { buildMonobankClientInfoWith } from './monobank-fixtures';
import { stubClientInfo } from './monobank-server';

import type { AccountEntityInterface, BankSyncEntityInterface } from '@budgie/contracts';

interface MonobankFixtureInput {
    readonly externalId?: string;
    readonly mode?: string;
    readonly forwardSyncFromAt?: Date;
}

interface MonobankFixtureOutput {
    readonly account: AccountEntityInterface;
    readonly bankSync: BankSyncEntityInterface;
}

export const setupMonobankFixture = (input: MonobankFixtureInput = {}): MonobankFixtureOutput => {
    const externalId = input.externalId ?? 'mono-acc-1';
    const account = seed.account({ externalId, type: 'BANK_SYNC', instrumentId: 1 });
    const bankSync = seed.bankSync({
        accountId: account.id,
        mode: input.mode ?? 'FORWARD',
        forwardSyncFromAt: input.forwardSyncFromAt ?? new Date(2026, 0, 1)
    });
    stubClientInfo(buildMonobankClientInfoWith([externalId]));
    return { account, bankSync };
};
