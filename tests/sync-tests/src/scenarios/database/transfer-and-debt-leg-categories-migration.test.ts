import { AccountDebtTypeEnum, AccountTypeEnum, BORROWING_CATEGORY_ID, LENDING_CATEGORY_ID } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { applyMigration, seed, testDb, run } from '../../harness';

const MIGRATION_FILE_NAME = '0066_fix_transfer_and_debt_leg_categories.sql';
const SEEDED_AT = 1_700_000_000;
const CURRENCY_TRANSFER_CATEGORY_ID = 7;
const DEBT_PAYMENTS_CATEGORY_ID = 17;
const USER_CATEGORY_ID = 20;
const FEE_CATEGORY_ID = 32;

const insertTransaction = async (type: string): Promise<number> => {
    const row = await testDb.$client.getFirstAsync<{ id: number }>(
        `INSERT INTO transactions (created_at, updated_at, type, title, operated_at, exchange_rate) VALUES (${SEEDED_AT}, ${SEEDED_AT}, '${type}', 'Synthetic', ${SEEDED_AT}, 1) RETURNING id`
    );

    return row?.id ?? 0;
};

const insertEntry = async (transactionId: number, accountId: number, type: string, categoryId: number | null, categorySource: string) => {
    await testDb.$client.runAsync(
        `INSERT INTO transaction_entries (created_at, updated_at, type, account_id, transaction_id, amount, category_id, category_source) VALUES (${SEEDED_AT}, ${SEEDED_AT}, '${type}', ${accountId}, ${transactionId}, 1000000, ${categoryId ?? 'NULL'}, '${categorySource}')`
    );
};

const insertDebtLeg = async (fundingAccountId: number, debtAccountId: number, categoryId: number | null, categorySource: string) => {
    const transactionId = await insertTransaction('EXPENSE');

    await insertEntry(transactionId, fundingAccountId, 'CREDIT', categoryId, categorySource);
    await testDb.$client.runAsync(
        `INSERT INTO debt_events (debt_account_id, transaction_id, direction, source, amount) VALUES (${debtAccountId}, ${transactionId}, 'CLOSE', 'INCOME_ATTACHMENT', 1000000)`
    );

    return transactionId;
};

const insertTransfer = async (fromAccountId: number, toAccountId: number, categoryId: number) => {
    const transactionId = await insertTransaction('TRANSFER');

    await insertEntry(transactionId, fromAccountId, 'CREDIT', categoryId, 'USER');
    await insertEntry(transactionId, toAccountId, 'DEBIT', categoryId, 'USER');

    return transactionId;
};

const fetchEntries = () =>
    testDb.$client.getAllAsync<{
        transactionId: number;
        type: string;
        categoryId: number | null;
        categorySource: string;
        updatedAt: number;
    }>(
        'SELECT transaction_id AS transactionId, type, category_id AS categoryId, category_source AS categorySource, updated_at AS updatedAt FROM transaction_entries ORDER BY id'
    );

describe('database/transfer-and-debt-leg-categories-migration', () => {
    it('recategorizes debt legs by direction, clears system categories on transfer legs, and is a no-op on the second run', async () => {
        const card = seed.account({ title: 'Synthetic card', type: AccountTypeEnum.BANK_SYNC });
        const cash = seed.account({ title: 'Synthetic cash', type: AccountTypeEnum.CASH });
        const borrowed = seed.account({ title: 'Synthetic borrowed', type: AccountTypeEnum.DEBT, debtType: AccountDebtTypeEnum.BORROW });
        const lent = seed.account({ title: 'Synthetic lent', type: AccountTypeEnum.DEBT, debtType: AccountDebtTypeEnum.LENT });

        const currencyTransferLeg = await insertDebtLeg(card.id, borrowed.id, CURRENCY_TRANSFER_CATEGORY_ID, 'USER');
        const debtPaymentsLeg = await insertDebtLeg(card.id, borrowed.id, DEBT_PAYMENTS_CATEGORY_ID, 'DEBT_SETTLEMENT');
        const uncategorizedLeg = await insertDebtLeg(card.id, lent.id, null, 'USER');
        const userCategorizedLeg = await insertDebtLeg(card.id, lent.id, USER_CATEGORY_ID, 'USER');
        const systemTransfer = await insertTransfer(card.id, cash.id, CURRENCY_TRANSFER_CATEGORY_ID);
        const userTransfer = await insertTransfer(card.id, cash.id, USER_CATEGORY_ID);
        await insertEntry(systemTransfer, card.id, 'FEE', FEE_CATEGORY_ID, 'FEE');

        await run(applyMigration(MIGRATION_FILE_NAME));
        const firstRun = await fetchEntries();
        await run(applyMigration(MIGRATION_FILE_NAME));

        expect(
            firstRun.map(({ transactionId, type, categoryId, categorySource }) => ({ transactionId, type, categoryId, categorySource }))
        ).toEqual([
            { transactionId: currencyTransferLeg, type: 'CREDIT', categoryId: BORROWING_CATEGORY_ID, categorySource: 'DEBT_SETTLEMENT' },
            { transactionId: debtPaymentsLeg, type: 'CREDIT', categoryId: BORROWING_CATEGORY_ID, categorySource: 'DEBT_SETTLEMENT' },
            { transactionId: uncategorizedLeg, type: 'CREDIT', categoryId: LENDING_CATEGORY_ID, categorySource: 'DEBT_SETTLEMENT' },
            { transactionId: userCategorizedLeg, type: 'CREDIT', categoryId: USER_CATEGORY_ID, categorySource: 'USER' },
            { transactionId: systemTransfer, type: 'CREDIT', categoryId: null, categorySource: 'USER' },
            { transactionId: systemTransfer, type: 'DEBIT', categoryId: null, categorySource: 'USER' },
            { transactionId: userTransfer, type: 'CREDIT', categoryId: USER_CATEGORY_ID, categorySource: 'USER' },
            { transactionId: userTransfer, type: 'DEBIT', categoryId: USER_CATEGORY_ID, categorySource: 'USER' },
            { transactionId: systemTransfer, type: 'FEE', categoryId: FEE_CATEGORY_ID, categorySource: 'FEE' }
        ]);
        expect(await fetchEntries()).toEqual(firstRun);
    });
});
