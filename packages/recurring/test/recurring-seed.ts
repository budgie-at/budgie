import { PRECISION, RecurringCadenceUnitEnum, RecurringSeriesKindEnum, RecurringSeriesStatusEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { RecurringRepository } from '../src/repository/recurring.repository';

import { detectAt, findSeries, testSeedService } from './test-context';

import type { AccountCreateEntityInterface, RecurringSeriesCreateEntityInterface } from '@budgie/contracts';

export const NOW = new Date(2026, 5, 15, 12);
export const JUNE = 5;
export const DEFAULT_INSTRUMENT_ID = 1;
export const ACTIVE_CONFIDENCE = 60;

export const seedCharges = Effect.fnUntraced(function* (accountInput: Partial<AccountCreateEntityInterface> = {}) {
    const { id: accountId } = yield* testSeedService.account({ instrumentId: DEFAULT_INSTRUMENT_ID, ...accountInput });
    let sequence = 0;

    return Effect.fnUntraced(function* (title: string, monthsAgo: number, day: number, amount: number, isIncome = false) {
        const operatedAt = new Date(2026, JUNE - monthsAgo, day, 12);
        sequence += 1;
        const transaction = { externalId: `${title}-${accountId}-${sequence}`, operatedAt };
        const entry = { accountId, amount: amount * PRECISION };
        const { id } = yield* isIncome
            ? testSeedService.bankPairIncome(transaction, entry)
            : testSeedService.bankPairExpense(transaction, entry);
        yield* testSeedService.updateTransaction(id, { title });

        return id;
    });
});

export const seedMonthlyCharges = (
    seed: Effect.Success<ReturnType<typeof seedCharges>>,
    title: string,
    months: readonly number[],
    day: number,
    amount: number
) => Effect.forEach(months, monthsAgo => seed(title, monthsAgo, day, amount));

const MIGRATED_CADENCES = [
    [7, RecurringCadenceUnitEnum.WEEK, 1],
    [14, RecurringCadenceUnitEnum.WEEK, 2],
    [30, RecurringCadenceUnitEnum.MONTH, 1],
    [61, RecurringCadenceUnitEnum.MONTH, 2],
    [91, RecurringCadenceUnitEnum.MONTH, 3],
    [183, RecurringCadenceUnitEnum.MONTH, 6],
    [365, RecurringCadenceUnitEnum.YEAR, 1]
] as const;

export const seedSavedSeries = (
    input: Pick<RecurringSeriesCreateEntityInterface, 'merchantKey' | 'title' | 'amount' | 'userState' | 'lastSeenAt'> &
        Partial<Pick<RecurringSeriesCreateEntityInterface, 'periodDays'>>
) => {
    const periodDays = input.periodDays ?? 30;
    const [, cadenceUnit, cadenceInterval] = MIGRATED_CADENCES.reduce((nearest, cadence) =>
        Math.abs(cadence[0] - periodDays) < Math.abs(nearest[0] - periodDays) ? cadence : nearest
    );

    return Effect.flatMap(RecurringRepository, repository =>
        repository.createSeries({
            ...input,
            categoryId: null,
            kind: RecurringSeriesKindEnum.EXPENSE,
            periodDays,
            status: RecurringSeriesStatusEnum.ACTIVE,
            cadenceUnit,
            cadenceInterval,
            anchorDate: input.lastSeenAt,
            instrumentId: DEFAULT_INSTRUMENT_ID,
            confidence: ACTIVE_CONFIDENCE
        })
    );
};

export const seedDetectedSeries = Effect.fnUntraced(function* () {
    const seed = yield* seedCharges();
    const ids = yield* seedMonthlyCharges(seed, 'NETFLIX', [5, 4, 3, 2], 5, 12);
    yield* detectAt(NOW);
    const [detected] = yield* findSeries();

    return { seed, ids, detected };
});

export const seedNetflixCharge = Effect.fnUntraced(function* () {
    const seed = yield* seedCharges();
    const [transactionId] = yield* seedMonthlyCharges(seed, 'NETFLIX', [0], 5, 12);

    return transactionId;
});
