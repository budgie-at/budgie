import { AccountTypeEnum, CASH_WITHDRAWAL_TRACKED_CATEGORY_ID, CategorySourceEnum, TransactionTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { applyMigration, fetchExpenseEntries, fetchTransactionById, seed, seedBankPair, testDb } from '../../harness';

const AMOUNT = 408_000_000;
const OPERATED_AT = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);
const MIGRATION = '0071_seed_tracked_cash_withdrawal_category.sql';

const seedExpense = (bankAccountId: number, externalId: string) =>
    seedBankPair.expense({ externalId, operatedAt: OPERATED_AT }, { accountId: bankAccountId, amount: AMOUNT });

const moveBeforeMccSeed = async (transactionIds: number[]): Promise<void> => {
    await testDb.$client.execAsync(
        `UPDATE transaction_entries SET created_at = (SELECT MIN(created_at) FROM mcc_categories) - 86400 WHERE transaction_id IN (${transactionIds.join(',')})`
    );
};

describe('database/tracked-cash-withdrawal-category-migration', () => {
    it('seeds the system category and marks only pre-seed Monobank ATM withdrawals, idempotently', async () => {
        const bankAccount = seed.account({ externalId: 'mono-bank', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
        const historicalAtm = seedExpense(bankAccount.id, 'tx-historical-atm');
        const postSeedAtm = seedExpense(bankAccount.id, 'tx-post-seed-atm');
        const historicalShop = seedExpense(bankAccount.id, 'tx-historical-shop');
        await testDb.$client.execAsync(
            `UPDATE transactions SET title = 'Банкомат Erste Bank' WHERE id IN (${historicalAtm.id}, ${postSeedAtm.id})`
        );
        await moveBeforeMccSeed([historicalAtm.id, historicalShop.id]);
        await testDb.$client.execAsync(
            `DELETE FROM default_category_translations WHERE category_id = ${CASH_WITHDRAWAL_TRACKED_CATEGORY_ID}`
        );
        await testDb.$client.execAsync(`DELETE FROM categories WHERE id = ${CASH_WITHDRAWAL_TRACKED_CATEGORY_ID}`);

        await applyMigration(MIGRATION);
        await applyMigration(MIGRATION);

        const [category] = await testDb.$client.getAllAsync<{ isSystemCategory: number; title: string }>(
            `SELECT is_system_category as isSystemCategory, title FROM categories WHERE id = ${CASH_WITHDRAWAL_TRACKED_CATEGORY_ID}`
        );
        const translationCount = await testDb.$client.getAllAsync<{ count: number }>(
            `SELECT COUNT(*) as count FROM default_category_translations WHERE category_id = ${CASH_WITHDRAWAL_TRACKED_CATEGORY_ID}`
        );
        const [historicalEntry] = await fetchExpenseEntries(historicalAtm.id);
        const [postSeedEntry] = await fetchExpenseEntries(postSeedAtm.id);
        const [shopEntry] = await fetchExpenseEntries(historicalShop.id);

        expect(category).toEqual({ isSystemCategory: 1, title: 'Cash withdrawal (tracked elsewhere)' });
        expect(translationCount).toEqual([{ count: 5 }]);
        expect(historicalEntry.categoryId).toBe(CASH_WITHDRAWAL_TRACKED_CATEGORY_ID);
        expect(historicalEntry.categorySource).toBe(CategorySourceEnum.USER);
        expect(historicalEntry.amount).toBe(AMOUNT);
        expect(historicalEntry.accountId).toBe(bankAccount.id);
        expect(fetchTransactionById(historicalAtm.id).type).toBe(TransactionTypeEnum.EXPENSE);
        expect(postSeedEntry.categoryId).toBeNull();
        expect(shopEntry.categoryId).toBeNull();
    });

    it('leaves withdrawals uncategorized when a user category already owns the reserved id', async () => {
        const bankAccount = seed.account({ externalId: 'mono-bank', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
        const historicalAtm = seedExpense(bankAccount.id, 'tx-historical-atm');
        await testDb.$client.execAsync(`UPDATE transactions SET title = 'Банкомат Erste Bank' WHERE id = ${historicalAtm.id}`);
        await moveBeforeMccSeed([historicalAtm.id]);
        await testDb.$client.execAsync(
            `DELETE FROM default_category_translations WHERE category_id = ${CASH_WITHDRAWAL_TRACKED_CATEGORY_ID}`
        );
        await testDb.$client.execAsync(
            `UPDATE categories SET is_system_category = 0, title = 'Cigarettes' WHERE id = ${CASH_WITHDRAWAL_TRACKED_CATEGORY_ID}`
        );

        await applyMigration(MIGRATION);

        const [historicalEntry] = await fetchExpenseEntries(historicalAtm.id);

        expect(historicalEntry.categoryId).toBeNull();
    });
});
