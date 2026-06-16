import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import type { BudgetCategorySpentInterface } from '../interface/budget-category-spent.interface';
import type { BudgetSpentEntryInterface } from '../interface/budget-spent-entry.interface';
import type { BudgetSpentInterface } from '../interface/budget-spent.interface';

class BudgetSpentService {
    @Log(
        (entries, baseInstrumentId) =>
            `enter entries=${entries.map(entry => `${entry.amount}:${isDefined(entry.categoryId) ? entry.categoryId : ''}:${entry.instrumentId}:${isDefined(entry.rate) ? entry.rate : ''}`).join(',')} baseInstrumentId=${baseInstrumentId}`,
        (result, entries, baseInstrumentId) =>
            `done entries=${entries.map(entry => `${entry.amount}:${isDefined(entry.categoryId) ? entry.categoryId : ''}:${entry.instrumentId}:${isDefined(entry.rate) ? entry.rate : ''}`).join(',')} baseInstrumentId=${baseInstrumentId} spentOverall=${result.spentOverall} spentByCategory=${result.spentByCategory.map(entry => `${entry.categoryId}:${entry.spent}`).join(',')}`,
        (error, entries, baseInstrumentId) =>
            `throw entries=${entries.map(entry => `${entry.amount}:${isDefined(entry.categoryId) ? entry.categoryId : ''}:${entry.instrumentId}:${isDefined(entry.rate) ? entry.rate : ''}`).join(',')} baseInstrumentId=${baseInstrumentId} error=${getErrorMessage(error)}`
    )
    computeSpent(entries: readonly BudgetSpentEntryInterface[], baseInstrumentId: number): BudgetSpentInterface {
        let spentOverall = 0;
        const categoryTotals = new Map<number, number>();

        for (const entry of entries) {
            const convertedAmount = this.convertEntryAmount(entry, baseInstrumentId);
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
    }

    @Log(
        (entry, baseInstrumentId) =>
            `enter amount=${entry.amount} categoryId=${isDefined(entry.categoryId) ? entry.categoryId : ''} instrumentId=${entry.instrumentId} rate=${isDefined(entry.rate) ? entry.rate : ''} baseInstrumentId=${baseInstrumentId}`,
        (result, entry, baseInstrumentId) =>
            `done amount=${entry.amount} categoryId=${isDefined(entry.categoryId) ? entry.categoryId : ''} instrumentId=${entry.instrumentId} rate=${isDefined(entry.rate) ? entry.rate : ''} baseInstrumentId=${baseInstrumentId} convertedAmount=${result}`,
        (error, entry, baseInstrumentId) =>
            `throw amount=${entry.amount} categoryId=${isDefined(entry.categoryId) ? entry.categoryId : ''} instrumentId=${entry.instrumentId} rate=${isDefined(entry.rate) ? entry.rate : ''} baseInstrumentId=${baseInstrumentId} error=${getErrorMessage(error)}`
    )
    convertEntryAmount(entry: BudgetSpentEntryInterface, baseInstrumentId: number): number {
        const isBaseInstrument = entry.instrumentId === baseInstrumentId;
        const rate = isBaseInstrument ? 1 : entry.rate;

        if (!isDefined(rate)) {
            return entry.amount;
        }

        return Math.round(entry.amount * rate);
    }
}

export const budgetSpentService = new BudgetSpentService();
