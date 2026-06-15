import { budgetPeriodService, budgetTemplateService } from '@budgie/budget';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useState } from 'react';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { budgetRepository } from '../../@generic/drizzle/db/db';
import { useSetting } from '../../settings/hook/use-setting.hook';

import type {
    BudgetSuggestedTemplateConfigInterface,
    BudgetTemplateDraftInterface,
    BudgetTemplateResolutionInterface
} from '@budgie/budget';

const MIN_WINDOW_MONTHS = 2;
const MAX_WINDOW_MONTHS = 4;
const MIN_ENTRIES_PER_MONTH = 15;
const MIN_DISTINCT_CATEGORIES = 4;

const ZERO_DRAFT: BudgetTemplateDraftInterface = { overallLimit: 0, categoryLimits: [] };

const SUGGESTED_TEMPLATE_CONFIG: BudgetSuggestedTemplateConfigInterface = {
    minWindowMonths: MIN_WINDOW_MONTHS,
    maxWindowMonths: MAX_WINDOW_MONTHS,
    minEntriesPerMonth: MIN_ENTRIES_PER_MONTH,
    minDistinctCategories: MIN_DISTINCT_CATEGORIES
};

export const useSuggestedBudgetTemplate = (): BudgetTemplateResolutionInterface => {
    const defaultInstrumentId = useSetting('defaultInstrumentId');
    const baseInstrumentId = isPositiveNumber(defaultInstrumentId) ? defaultInstrumentId : 0;

    const [now] = useState(() => new Date());
    const window = budgetPeriodService.computeTrailingMonthsWindow(now, MAX_WINDOW_MONTHS);

    const entriesQuery = budgetRepository.findBudgetSpentEntries(window.start, window.end, baseInstrumentId);
    const { data: entriesData, updatedAt } = useLiveQuery(entriesQuery, [window.start.getTime(), window.end.getTime(), baseInstrumentId]);

    if (!isPositiveNumber(baseInstrumentId)) {
        return { draft: ZERO_DRAFT, isReady: true, isAvailable: false, stats: null };
    }

    if (!isDefined(updatedAt)) {
        return { draft: ZERO_DRAFT, isReady: false, isAvailable: false, stats: null };
    }

    return budgetTemplateService.buildSuggestedBudgetTemplateResolution(entriesData, now, baseInstrumentId, SUGGESTED_TEMPLATE_CONFIG);
};
