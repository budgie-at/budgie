import { BudgetRepository, computeIncomeReceived, computeSpent } from '@budgie/budget';
import { AccountTypeEnum, DEFAULT_TRANSACTION_FILTER, PRECISION, StatisticsRepository, TransactionEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { testDb, testSeedService } from './test-context';

const PARITY_INSTRUMENT_ID = 1;
const PARITY_PERIOD_START = new Date('2026-06-01T00:00:00.000Z');
const PARITY_NEXT_PERIOD_START = new Date('2026-07-01T00:00:00.000Z');
const PARITY_OPERATED_AT = new Date('2026-06-15T12:00:00.000Z');

export const seedParityAccounts = Effect.fnUntraced(function* () {
    const bankAccount = yield* testSeedService.account({ type: AccountTypeEnum.BANK_SYNC, instrumentId: PARITY_INSTRUMENT_ID });
    const counterpartAccount = yield* testSeedService.account({ type: AccountTypeEnum.BANK_SYNC, instrumentId: PARITY_INSTRUMENT_ID });
    const debtAccount = yield* testSeedService.account({ type: AccountTypeEnum.DEBT, instrumentId: PARITY_INSTRUMENT_ID });

    return { bankAccount, counterpartAccount, debtAccount };
});

export const seedParityTransfer = (sourceAccountId: number, targetAccountId: number, amount: number) =>
    testSeedService.directTransfer({
        exchangeRate: 1,
        operatedAt: PARITY_OPERATED_AT,
        sourceAccountId,
        sourceAmount: amount * PRECISION,
        sourceEntryExchangeRate: 1,
        targetAccountId,
        targetAmount: amount * PRECISION,
        toIban: null
    });

export const markConsolidatedChild = (childTransactionId: number, parentTransactionId: number) =>
    testDb
        .update(TransactionEntityTable)
        .set({ consolidationParentTransactionId: parentTransactionId })
        .where(eq(TransactionEntityTable.id, childTransactionId));

export const readParityStatistics = Effect.fnUntraced(function* () {
    const statisticsRepository = yield* StatisticsRepository;
    const [totals] = yield* statisticsRepository.getTotalIncomeAndExpenseQuery(
        { ...DEFAULT_TRANSACTION_FILTER, date: { from: PARITY_PERIOD_START, to: new Date(PARITY_NEXT_PERIOD_START.getTime() - 1) } },
        PARITY_INSTRUMENT_ID
    );

    return totals;
});

export const seedParityExpense = (externalId: string, accountId: number, amount: number, operatedAt = PARITY_OPERATED_AT) =>
    testSeedService.bankPairExpense({ externalId, operatedAt }, { accountId, amount: amount * PRECISION });

export const seedParityIncome = (externalId: string, accountId: number, amount: number, operatedAt = PARITY_OPERATED_AT) =>
    testSeedService.bankPairIncome({ externalId, operatedAt }, { accountId, amount: amount * PRECISION });

export const readBudgetSpent = Effect.fnUntraced(function* () {
    const budgetRepository = yield* BudgetRepository;
    const entries = yield* budgetRepository.findBudgetSpentEntries(PARITY_PERIOD_START, PARITY_NEXT_PERIOD_START, PARITY_INSTRUMENT_ID);

    return computeSpent(entries, PARITY_INSTRUMENT_ID).spentOverall;
});

export const readBudgetIncomeReceived = Effect.fnUntraced(function* () {
    const budgetRepository = yield* BudgetRepository;
    const entries = yield* budgetRepository.findIncomeReceivedEntries(PARITY_PERIOD_START, PARITY_NEXT_PERIOD_START, PARITY_INSTRUMENT_ID);

    return computeIncomeReceived(entries, PARITY_INSTRUMENT_ID);
});
