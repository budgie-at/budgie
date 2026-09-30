import { budgetPeriodService, BudgetRepository, BudgetTemplateService } from '@budgie/budget';
import { AccountEntityTable, ExchangeRateEntityTable, TransactionEntityTable, TransactionEntryEntityTable } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';
import { useState } from 'react';

import { isPositiveNumber } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';
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

const NOT_READY_RESOLUTION: BudgetTemplateResolutionInterface = { draft: ZERO_DRAFT, isReady: false, isAvailable: false, stats: null };

const SUGGESTED_TEMPLATE_CONFIG: BudgetSuggestedTemplateConfigInterface = {
    minWindowMonths: MIN_WINDOW_MONTHS,
    maxWindowMonths: MAX_WINDOW_MONTHS,
    minEntriesPerMonth: MIN_ENTRIES_PER_MONTH,
    minDistinctCategories: MIN_DISTINCT_CATEGORIES
};

const suggestedBudgetTemplateAtom = Atom.family((key: { readonly nowTimestamp: number; readonly baseInstrumentId: number }) =>
    databaseQueryAtom(
        [TransactionEntryEntityTable, TransactionEntityTable, AccountEntityTable, ExchangeRateEntityTable],
        Effect.gen(function* () {
            const budgetRepository = yield* BudgetRepository;
            const budgetTemplateService = yield* BudgetTemplateService;
            const now = new Date(key.nowTimestamp);
            const window = budgetPeriodService.computeTrailingMonthsWindow(now, MAX_WINDOW_MONTHS);
            const entries = yield* budgetRepository.findBudgetSpentEntries(window.start, window.end, key.baseInstrumentId);

            return budgetTemplateService.buildSuggestedBudgetTemplateResolution(
                entries,
                now,
                key.baseInstrumentId,
                SUGGESTED_TEMPLATE_CONFIG
            );
        })
    )
);

export const useSuggestedBudgetTemplate = (): BudgetTemplateResolutionInterface => {
    const defaultInstrumentId = useSetting('defaultInstrumentId');
    const baseInstrumentId = isPositiveNumber(defaultInstrumentId) ? defaultInstrumentId : 0;

    const [nowTimestamp] = useState(() => Date.now());
    const result = useLiveAtomValue(suggestedBudgetTemplateAtom({ nowTimestamp, baseInstrumentId }));

    if (!isPositiveNumber(baseInstrumentId)) {
        return { draft: ZERO_DRAFT, isReady: true, isAvailable: false, stats: null };
    }

    return AsyncResult.getOrElse(result, () => NOT_READY_RESOLUTION);
};
