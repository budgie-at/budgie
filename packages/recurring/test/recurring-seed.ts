import { PRECISION } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { testSeedService } from './test-context';

import type { AccountCreateEntityInterface } from '@budgie/contracts';

export const NOW = new Date(2026, 5, 15, 12);
export const JUNE = 5;
export const DEFAULT_INSTRUMENT_ID = 1;

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
