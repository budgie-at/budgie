import { BudgetRepository, computeIncomeReceived } from '@budgie/budget';
import { AccountTypeEnum, DEFAULT_TRANSACTION_FILTER, PRECISION, StatisticsRepository, TransactionEntityTable } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { testDb, TestLayer, testSeedService } from '../harness/test-context';

const BASE_INSTRUMENT_ID = 1;
const PERIOD_START = new Date('2026-06-01T00:00:00.000Z');
const NEXT_PERIOD_START = new Date('2026-07-01T00:00:00.000Z');
const OPERATED_AT = new Date('2026-06-15T12:00:00.000Z');
const OUTSIDE_WINDOW = new Date('2026-05-20T12:00:00.000Z');

layer(TestLayer)('budget income received', it => {
    it.effect('matches the statistics income and ignores expenses, transfers, debt accounts and consolidated children', () =>
        Effect.gen(function* () {
            const budgetRepository = yield* BudgetRepository;
            const statisticsRepository = yield* StatisticsRepository;
            const bankAccount = yield* testSeedService.account({ type: AccountTypeEnum.BANK_SYNC, instrumentId: BASE_INSTRUMENT_ID });
            const counterpartAccount = yield* testSeedService.account({
                type: AccountTypeEnum.BANK_SYNC,
                instrumentId: BASE_INSTRUMENT_ID
            });
            const debtAccount = yield* testSeedService.account({ type: AccountTypeEnum.DEBT, instrumentId: BASE_INSTRUMENT_ID });

            yield* testSeedService.bankPairIncome(
                { externalId: 'salary', operatedAt: OPERATED_AT },
                { accountId: bankAccount.id, amount: 2_000 * PRECISION }
            );
            yield* testSeedService.bankPairIncome(
                { externalId: 'previous-month', operatedAt: OUTSIDE_WINDOW },
                { accountId: bankAccount.id, amount: 900 * PRECISION }
            );
            yield* testSeedService.bankPairExpense(
                { externalId: 'groceries', operatedAt: OPERATED_AT },
                { accountId: bankAccount.id, amount: 30 * PRECISION }
            );
            yield* testSeedService.bankPairIncome(
                { externalId: 'debt-income', operatedAt: OPERATED_AT },
                { accountId: debtAccount.id, amount: 70 * PRECISION }
            );
            yield* testSeedService.directTransfer({
                exchangeRate: 1,
                operatedAt: OPERATED_AT,
                sourceAccountId: bankAccount.id,
                sourceAmount: 150 * PRECISION,
                sourceEntryExchangeRate: 1,
                targetAccountId: counterpartAccount.id,
                targetAmount: 150 * PRECISION,
                toIban: null
            });

            const transfer = yield* testSeedService.directTransfer({
                exchangeRate: 1,
                operatedAt: OPERATED_AT,
                sourceAccountId: bankAccount.id,
                sourceAmount: 40 * PRECISION,
                sourceEntryExchangeRate: 1,
                targetAccountId: counterpartAccount.id,
                targetAmount: 40 * PRECISION,
                toIban: null
            });
            const consolidatedChild = yield* testSeedService.bankPairIncome(
                { externalId: 'consolidated-income', operatedAt: OPERATED_AT },
                { accountId: bankAccount.id, amount: 40 * PRECISION }
            );

            yield* testDb
                .update(TransactionEntityTable)
                .set({ consolidationParentTransactionId: transfer.id })
                .where(eq(TransactionEntityTable.id, consolidatedChild.id));

            const entries = yield* budgetRepository.findIncomeReceivedEntries(PERIOD_START, NEXT_PERIOD_START, BASE_INSTRUMENT_ID);
            const incomeReceived = computeIncomeReceived(entries, BASE_INSTRUMENT_ID);
            const statistics = yield* statisticsRepository.getTotalIncomeAndExpenseQuery(
                { ...DEFAULT_TRANSACTION_FILTER, date: { from: PERIOD_START, to: new Date(NEXT_PERIOD_START.getTime() - 1) } },
                BASE_INSTRUMENT_ID
            );

            expect(statistics[0].income).toBe(2_000 * PRECISION);
            expect(incomeReceived).toBe(statistics[0].income);
        })
    );
});
