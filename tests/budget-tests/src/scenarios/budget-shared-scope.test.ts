import { TestSeedService } from '@budgie-at/test-kit';
import { BudgetRepository, computeIncomeReceived, computeSpent } from '@budgie/budget';
import { AccountEntityTable, HOUSEHOLD_SYNC_ZONE, PRECISION } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { seedParityAccounts, seedParityExpense, seedParityIncome, testDb, TestLayer } from '../harness';

const PERIOD_START = new Date('2026-06-01T00:00:00.000Z');
const NEXT_PERIOD_START = new Date('2026-07-01T00:00:00.000Z');
const INSTRUMENT_ID = 1;

layer(TestLayer)('shared budget spending scope', it => {
    it.effect('counts only household accounts for a household budget and every own account for a personal budget', () =>
        Effect.gen(function* () {
            const { bankAccount, counterpartAccount } = yield* seedParityAccounts();
            const budgetRepository = yield* BudgetRepository;
            const foreignAccount = yield* new TestSeedService(testDb).account({ title: 'Other member card' });
            yield* testDb.$client.unsafe("UPDATE accounts SET sync_zone = 'household' WHERE id = ?", [foreignAccount.id]);
            yield* testDb.$client.unsafe('DELETE FROM sync_outbox WHERE sync_id = (SELECT sync_id FROM accounts WHERE id = ?)', [
                foreignAccount.id
            ]);
            yield* seedParityExpense('foreign-groceries', foreignAccount.id, 70);
            yield* seedParityIncome('foreign-salary', foreignAccount.id, 600);

            yield* testDb
                .update(AccountEntityTable)
                .set({ syncZone: HOUSEHOLD_SYNC_ZONE })
                .where(eq(AccountEntityTable.id, counterpartAccount.id));
            yield* seedParityExpense('private-groceries', bankAccount.id, 30);
            yield* seedParityExpense('shared-groceries', counterpartAccount.id, 50);
            yield* seedParityIncome('private-salary', bankAccount.id, 1000);
            yield* seedParityIncome('shared-salary', counterpartAccount.id, 400);

            const sharedSpent = yield* budgetRepository.findBudgetSpentEntries(
                PERIOD_START,
                NEXT_PERIOD_START,
                INSTRUMENT_ID,
                HOUSEHOLD_SYNC_ZONE
            );
            const personalSpent = yield* budgetRepository.findBudgetSpentEntries(PERIOD_START, NEXT_PERIOD_START, INSTRUMENT_ID);
            const sharedIncome = yield* budgetRepository.findIncomeReceivedEntries(
                PERIOD_START,
                NEXT_PERIOD_START,
                INSTRUMENT_ID,
                HOUSEHOLD_SYNC_ZONE
            );
            const personalIncome = yield* budgetRepository.findIncomeReceivedEntries(PERIOD_START, NEXT_PERIOD_START, INSTRUMENT_ID);

            expect(computeSpent(sharedSpent, INSTRUMENT_ID).spentOverall).toBe(120 * PRECISION);
            expect(computeSpent(personalSpent, INSTRUMENT_ID).spentOverall).toBe(80 * PRECISION);
            expect(computeIncomeReceived(sharedIncome, INSTRUMENT_ID)).toBe(1000 * PRECISION);
            expect(computeIncomeReceived(personalIncome, INSTRUMENT_ID)).toBe(1400 * PRECISION);
        })
    );
});
