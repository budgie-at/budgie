import { subMonths } from 'date-fns';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useState } from 'react';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { budgetRepository } from '../../@generic/drizzle/db/db';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { buildSuggestedBudgetTemplate } from '../utils/build-suggested-budget-template.util';
import { computeBudgetSpent } from '../utils/compute-budget-spent.util';
import { computeTrailingMonthsWindow } from '../utils/compute-trailing-months-window.util';
import { resolveSuggestedWindowMonths } from '../utils/resolve-suggested-window-months.util';

import type { BudgetTemplateDraftInterface } from '../interface/budget-template-draft.interface';
import type { BudgetTemplateResolutionInterface } from '../interface/budget-template-resolution.interface';

const MIN_WINDOW_MONTHS = 2;
const MAX_WINDOW_MONTHS = 4;
const MIN_ENTRIES_PER_MONTH = 15;
const MIN_DISTINCT_CATEGORIES = 4;

const ZERO_DRAFT: BudgetTemplateDraftInterface = { overallLimit: 0, categoryLimits: [] };

interface SuggestedSpentEntryInterface {
    readonly amount: number;
    readonly categoryId: number | null;
    readonly instrumentId: number;
    readonly rate: number | null;
    readonly operatedAt: Date;
}

const buildSuggestedResolution = (
    entries: readonly SuggestedSpentEntryInterface[],
    now: Date,
    baseInstrumentId: number
): BudgetTemplateResolutionInterface => {
    const windowStartMax = computeTrailingMonthsWindow(now, MAX_WINDOW_MONTHS).start;
    const effectiveMonths = resolveSuggestedWindowMonths(entries, windowStartMax, MAX_WINDOW_MONTHS, MIN_ENTRIES_PER_MONTH);

    if (effectiveMonths < MIN_WINDOW_MONTHS) {
        return { draft: ZERO_DRAFT, isReady: true, isAvailable: false, stats: null };
    }

    const minHistoryThreshold = subMonths(now, MIN_WINDOW_MONTHS).getTime();
    const hasMinimumHistory = entries.some(entry => entry.operatedAt.getTime() <= minHistoryThreshold);

    const windowStart = computeTrailingMonthsWindow(now, effectiveMonths).start;
    const recentEntries = entries.filter(entry => entry.operatedAt.getTime() >= windowStart.getTime());
    const spent = computeBudgetSpent(recentEntries, baseInstrumentId);
    const draft = buildSuggestedBudgetTemplate(spent.spentByCategory, effectiveMonths);
    const hasEnoughCategories = spent.spentByCategory.length >= MIN_DISTINCT_CATEGORIES;
    const isAvailable = isNotEmptyArray(draft.categoryLimits) && hasEnoughCategories && hasMinimumHistory;
    const stats = {
        months: effectiveMonths,
        transactionsCount: recentEntries.length,
        categoriesCount: spent.spentByCategory.length
    };

    return { draft, isReady: true, isAvailable, stats };
};

export const useSuggestedBudgetTemplate = (): BudgetTemplateResolutionInterface => {
    const defaultInstrumentId = useSetting('defaultInstrumentId');
    const baseInstrumentId = isPositiveNumber(defaultInstrumentId) ? defaultInstrumentId : 0;

    const [now] = useState(() => new Date());
    const window = computeTrailingMonthsWindow(now, MAX_WINDOW_MONTHS);

    const entriesQuery = budgetRepository.findBudgetSpentEntries(window.start, window.end, baseInstrumentId);
    const { data: entriesData, updatedAt } = useLiveQuery(entriesQuery, [window.start.getTime(), window.end.getTime(), baseInstrumentId]);

    if (!isPositiveNumber(baseInstrumentId)) {
        return { draft: ZERO_DRAFT, isReady: true, isAvailable: false, stats: null };
    }

    if (!isDefined(updatedAt)) {
        return { draft: ZERO_DRAFT, isReady: false, isAvailable: false, stats: null };
    }

    return buildSuggestedResolution(entriesData, now, baseInstrumentId);
};
