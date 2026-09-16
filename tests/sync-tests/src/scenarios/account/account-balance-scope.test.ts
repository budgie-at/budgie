import { accountBalanceRepository } from '@app/@generic/drizzle/db/db';
import { accountBalanceIncrementalService } from '@app/account/service/account-balance-incremental.service';
import { AccountBalanceEntityTable, AccountTypeEnum } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { seed, seedExpenseEntry, testDb } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';

const OLD_BALANCE_UPDATED_AT = new Date(2026, 0, 1);

const fetchBalanceRow = (accountId: number) =>
    testDb.select().from(AccountBalanceEntityTable).where(eq(AccountBalanceEntityTable.accountId, accountId)).get();

describe('account/account-balance-scope', () => {
    it('rebuilds only requested account balances', async () => {
        const changedAccount = seed.account({ type: AccountTypeEnum.BANK, instrumentId: 1 });
        const untouchedAccount = seed.account({ type: AccountTypeEnum.CASH, instrumentId: 1 });

        insertOne(AccountBalanceEntityTable, {
            accountId: changedAccount.id,
            amount: 10_000,
            updatedAt: OLD_BALANCE_UPDATED_AT
        });
        insertOne(AccountBalanceEntityTable, {
            accountId: untouchedAccount.id,
            amount: 50_000,
            updatedAt: OLD_BALANCE_UPDATED_AT
        });
        seedExpenseEntry(changedAccount.id, 12_000, 'Scoped expense');

        await accountBalanceIncrementalService.updateBalancesByAccountIds([changedAccount.id]);

        const changedBalance = accountBalanceRepository.getByAccountId(changedAccount.id).get();
        const untouchedBalance = fetchBalanceRow(untouchedAccount.id);

        expect(changedBalance?.balance).toBe(-12_000);
        expect(untouchedBalance?.amount).toBe(50_000);
        expect(untouchedBalance?.updatedAt).toEqual(OLD_BALANCE_UPDATED_AT);
    });
});
