import { accountBalanceRepository } from '@app/@generic/drizzle/db/db';
import { accountBalanceIncrementalService } from '@app/account/service/account-balance-incremental.service';
import {
    AccountBalanceEntityTable,
    AccountTypeEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { seed, testDb } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';

const OLD_BALANCE_UPDATED_AT = new Date(2026, 0, 1);

const seedExpenseEntry = (accountId: number, amount: number): void => {
    const transaction = insertOne(TransactionEntityTable, {
        type: TransactionTypeEnum.EXPENSE,
        title: 'Scoped expense',
        externalId: null,
        comment: '',
        toAccountId: null,
        fromAccountId: accountId,
        exchangeRate: 1,
        externalSource: null,
        updatedBy: null,
        needsEmbedding: false
    });

    insertOne(TransactionEntryEntityTable, {
        transactionId: transaction.id,
        accountId,
        type: TransactionEntryTypeEnum.CREDIT,
        amount,
        categoryId: null,
        mccCategoryId: null,
        externalId: null,
        exchangeRate: 1,
        baseInstrumentId: null,
        baseExchangeRate: null,
        baseAmount: null,
        toIban: null,
        originalTransactionId: null
    });
};

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
        seedExpenseEntry(changedAccount.id, 12_000);

        await accountBalanceIncrementalService.updateBalancesByAccountIds([changedAccount.id]);

        const changedBalance = accountBalanceRepository.getByAccountId(changedAccount.id).get();
        const untouchedBalance = fetchBalanceRow(untouchedAccount.id);

        expect(changedBalance?.balance).toBe(-12_000);
        expect(untouchedBalance?.amount).toBe(50_000);
        expect(untouchedBalance?.updatedAt).toEqual(OLD_BALANCE_UPDATED_AT);
    });
});
