import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import type { BudgetCategorySpentInterface } from '../interface/budget-category-spent.interface';
import type { BudgetSpentEntryInterface } from '../interface/budget-spent-entry.interface';
import type { BudgetSpentInterface } from '../interface/budget-spent.interface';

export class BudgetSpentService extends Context.Service<BudgetSpentService>()('@budgie/budget/BudgetSpentService', {
    make: Effect.sync(() => {
        const convertEntryAmount = (entry: BudgetSpentEntryInterface, baseInstrumentId: number): number => {
            const isBaseInstrument = entry.instrumentId === baseInstrumentId;
            const rate = isBaseInstrument ? 1 : entry.rate;

            if (!isDefined(rate)) {
                return entry.amount;
            }

            return Math.round(entry.amount * rate);
        };

        const computeSpent = (entries: readonly BudgetSpentEntryInterface[], baseInstrumentId: number): BudgetSpentInterface => {
            let spentOverall = 0;
            const categoryTotals = new Map<number, number>();

            for (const entry of entries) {
                const convertedAmount = convertEntryAmount(entry, baseInstrumentId);
                spentOverall += convertedAmount;

                if (isDefined(entry.categoryId)) {
                    const previousTotal = categoryTotals.get(entry.categoryId);
                    const categoryTotal = isDefined(previousTotal) ? previousTotal : 0;
                    categoryTotals.set(entry.categoryId, categoryTotal + convertedAmount);
                }
            }

            const spentByCategory: readonly BudgetCategorySpentInterface[] = [...categoryTotals.entries()].map(([categoryId, spent]) => ({
                categoryId,
                spent
            }));

            return { spentOverall, spentByCategory };
        };

        return { computeSpent, convertEntryAmount };
    })
}) {
    static readonly layer = Layer.effect(BudgetSpentService, BudgetSpentService.make);
}
