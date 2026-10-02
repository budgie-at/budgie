import { BudgetRepository, BudgetSpentService } from '@budgie/budget';
import { AccountTypeEnum, DEFAULT_TRANSACTION_FILTER, PRECISION, StatisticsRepository, TransactionEntityTable } from '@budgie/contracts';
import { layer } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { testDb, TestLayer, testSeedService } from '../harness/test-context';

const BASE_INSTRUMENT_ID = 1;
const PERIOD_START = new Date('2026-06-01T00:00:00.000Z');
const NEXT_PERIOD_START = new Date('2026-07-01T00:00:00.000Z');
const OPERATED_AT = new Date('2026-06-15T12:00:00.000Z');

layer(TestLayer)('budget spent parity with statistics', it => {
    it.effect('matches the statistics expense for consolidated children, debt accounts and fees', () =>
        Effect.gen(function* () {
            const budgetRepository = yield* BudgetRepository;
            const budgetSpentService = yield* BudgetSpentService;
            const statisticsRepository = yield* StatisticsRepository;
            const bankAccount = testSeedService.account({ type: AccountTypeEnum.BANK_SYNC, instrumentId: BASE_INSTRUMENT_ID });
            const counterpartAccount = testSeedService.account({ type: AccountTypeEnum.BANK_SYNC, instrumentId: BASE_INSTRUMENT_ID });
            const debtAccount = testSeedService.account({ type: AccountTypeEnum.DEBT, instrumentId: BASE_INSTRUMENT_ID });

            testSeedService.bankPairExpense(
                { externalId: 'plain', operatedAt: OPERATED_AT },
                { accountId: bankAccount.id, amount: 10 * PRECISION }
            );

            const transfer = testSeedService.directTransfer({
                exchangeRate: 1,
                operatedAt: OPERATED_AT,
                sourceAccountId: bankAccount.id,
                sourceAmount: 30 * PRECISION,
                sourceEntryExchangeRate: 1,
                targetAccountId: counterpartAccount.id,
                targetAmount: 30 * PRECISION,
                toIban: null
            });
            const consolidatedChild = testSeedService.bankPairExpense(
                { externalId: 'consolidated-child', operatedAt: OPERATED_AT },
                { accountId: bankAccount.id, amount: 30 * PRECISION }
            );

            testDb
                .update(TransactionEntityTable)
                .set({ consolidationParentTransactionId: transfer.id })
                .where(eq(TransactionEntityTable.id, consolidatedChild.id))
                .run();

            testSeedService.bankPairExpense(
                { externalId: 'debt', operatedAt: OPERATED_AT },
                { accountId: debtAccount.id, amount: 20 * PRECISION }
            );

            const feeTransaction = testSeedService.bankPairExpense(
                { externalId: 'with-fee', operatedAt: OPERATED_AT },
                { accountId: bankAccount.id, amount: 5 * PRECISION }
            );

            testSeedService.feeEntry(feeTransaction.id, 'fee', { accountId: bankAccount.id, amount: 2 * PRECISION });

            const entries = yield* budgetRepository.findBudgetSpentEntries(PERIOD_START, NEXT_PERIOD_START, BASE_INSTRUMENT_ID);
            const { spentOverall } = budgetSpentService.computeSpent(entries, BASE_INSTRUMENT_ID);
            const statistics = yield* statisticsRepository.getTotalIncomeAndExpenseQuery(
                { ...DEFAULT_TRANSACTION_FILTER, date: { from: PERIOD_START, to: new Date(NEXT_PERIOD_START.getTime() - 1) } },
                BASE_INSTRUMENT_ID
            );

            expect(statistics[0].expense).toBe(17 * PRECISION);
            expect(spentOverall).toBe(statistics[0].expense);
        })
    );
});
