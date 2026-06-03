import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { accountBalanceRepository, statisticsRepository } from '@app/@generic/drizzle/db/db';
import {
    BANK_FEE_CATEGORY_ID,
    CategoryEntityTable,
    CategorySourceEnum,
    DEFAULT_TRANSACTION_FILTER,
    LanguageEnum,
    PRECISION,
    TransactionEntryEntityTable
} from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { buildMonobank, monobankStub, setupMonobankFixture, testDb } from '../../harness';

describe('monobank/fee-split', () => {
    it('splits the commission into a dedicated balance-impacting Bank Fees & Charges entry', async () => {
        const { account } = setupMonobankFixture();
        monobankStub.statement([buildMonobank.transaction({ id: 'tx-fee', amount: -6000, hold: false, commissionRate: -1000 })]);

        await monobankSyncService.sync();

        const [mainEntry] = testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.externalId, 'tx-fee'))
            .all();
        const [feeEntry] = testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.externalId, 'tx-fee:fee'))
            .all();

        const [feeCategory] = testDb.select().from(CategoryEntityTable).where(eq(CategoryEntityTable.id, BANK_FEE_CATEGORY_ID)).all();

        expect(mainEntry.amount).toBe(50 * PRECISION);
        expect(feeEntry.amount).toBe(10 * PRECISION);
        expect(feeEntry.type).toBe('FEE');
        expect(feeEntry.categoryId).toBe(BANK_FEE_CATEGORY_ID);
        expect(feeEntry.categorySource).toBe(CategorySourceEnum.FEE);
        expect(feeCategory.title).toBe('Bank Fees & Charges');

        const balance = accountBalanceRepository.getByAccountId(account.id).get();
        const totals = statisticsRepository.getTotalIncomeAndExpenseQuery(DEFAULT_TRANSACTION_FILTER, account.instrumentId).get();
        const categoryRows = statisticsRepository
            .getExpenseByCategoryQuery(DEFAULT_TRANSACTION_FILTER, account.instrumentId, LanguageEnum.EN)
            .all();
        const feeCategoryAmount = categoryRows.find(row => row.category?.id === BANK_FEE_CATEGORY_ID)?.amount;

        expect(balance?.balance).toBe(-60 * PRECISION);
        expect(totals?.expense).toBe(60 * PRECISION);
        expect(feeCategoryAmount).toBe(10 * PRECISION);
    });

    it('keeps a single entry when there is no commission', async () => {
        setupMonobankFixture();
        monobankStub.statement([buildMonobank.transaction({ id: 'tx-no-fee', amount: -6000, hold: false, commissionRate: 0 })]);

        await monobankSyncService.sync();

        const entries = testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.externalId, 'tx-no-fee:fee'))
            .all();

        expect(entries).toHaveLength(0);
    });
});
