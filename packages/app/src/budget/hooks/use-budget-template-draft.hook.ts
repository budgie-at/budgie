import {
    BudgetRepository,
    buildSuggestedBudgetTemplateResolution,
    computeTrailingMonthsWindow,
    resolveGenericBudgetTemplate
} from '@budgie/budget';
import {
    AccountEntityTable,
    CategoryEntityTable,
    CategoryRepository,
    ExchangeRateEntityTable,
    TransactionEntityTable,
    TransactionEntryEntityTable
} from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';
import { useState } from 'react';

import { isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';
import { useGetInstrumentByIdQuery } from '../../instrument/query/use-get-instrument-by-id.query';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { BudgetTemplateKindEnum } from '../enum/budget-template-kind.enum';

import type {
    BudgetSuggestedTemplateConfigInterface,
    BudgetTemplateDraftInterface,
    BudgetTemplateResolutionInterface
} from '@budgie/budget';

const MAX_WINDOW_MONTHS = 4;

const ZERO_DRAFT: BudgetTemplateDraftInterface = { overallLimit: 0, categoryLimits: [] };

const EMPTY_RESOLUTION: BudgetTemplateResolutionInterface = { draft: ZERO_DRAFT, isReady: true, isAvailable: false, stats: null };

const NOT_READY_RESOLUTION: BudgetTemplateResolutionInterface = { ...EMPTY_RESOLUTION, isReady: false };

const SUGGESTED_TEMPLATE_CONFIG: BudgetSuggestedTemplateConfigInterface = {
    minWindowMonths: 2,
    maxWindowMonths: MAX_WINDOW_MONTHS,
    minEntriesPerMonth: 15,
    minDistinctCategories: 4
};

const emptyResolutionAtom = Atom.make(AsyncResult.success(EMPTY_RESOLUTION));

const suggestedBudgetTemplateAtom = Atom.family((key: { readonly nowTimestamp: number; readonly baseInstrumentId: number }) =>
    databaseQueryAtom(
        [TransactionEntryEntityTable, TransactionEntityTable, AccountEntityTable, ExchangeRateEntityTable],
        Effect.gen(function* () {
            const budgetRepository = yield* BudgetRepository;
            const now = new Date(key.nowTimestamp);
            const window = computeTrailingMonthsWindow(now, MAX_WINDOW_MONTHS);
            const entries = yield* budgetRepository.findBudgetSpentEntries(window.start, window.end, key.baseInstrumentId);

            return buildSuggestedBudgetTemplateResolution(entries, now, key.baseInstrumentId, SUGGESTED_TEMPLATE_CONFIG);
        })
    )
);

const genericBudgetTemplateAtom = Atom.family((currencyCode: string) =>
    databaseQueryAtom(
        [CategoryEntityTable],
        Effect.gen(function* () {
            const categoryRepository = yield* CategoryRepository;
            const categories = yield* categoryRepository.findAllNonSystem();
            const draft = resolveGenericBudgetTemplate(categories, currencyCode);

            return { draft, isReady: true, isAvailable: isNotEmptyArray(draft.categoryLimits), stats: null };
        })
    )
);

const selectResolutionAtom = (
    kind: BudgetTemplateKindEnum | null,
    suggestedKey: { readonly nowTimestamp: number; readonly baseInstrumentId: number },
    currencyCode: string
) => {
    if (kind === BudgetTemplateKindEnum.SUGGESTED) {
        return suggestedBudgetTemplateAtom(suggestedKey);
    }

    if (kind === BudgetTemplateKindEnum.GENERIC) {
        return genericBudgetTemplateAtom(currencyCode);
    }

    return emptyResolutionAtom;
};

export const useBudgetTemplateDraft = (kind: BudgetTemplateKindEnum | null): BudgetTemplateResolutionInterface => {
    const defaultInstrumentId = useSetting('defaultInstrumentId');
    const baseInstrumentId = isPositiveNumber(defaultInstrumentId) ? defaultInstrumentId : 0;
    const [nowTimestamp] = useState(() => Date.now());
    const { instrument } = useGetInstrumentByIdQuery(baseInstrumentId);
    const currencyCode = isDefined(instrument) ? instrument.code : '';
    const isSuggested = kind === BudgetTemplateKindEnum.SUGGESTED;
    const isGeneric = kind === BudgetTemplateKindEnum.GENERIC;
    const resolutionAtom = selectResolutionAtom(kind, { nowTimestamp, baseInstrumentId }, currencyCode);
    const result = useAtomValue(resolutionAtom);

    if (isSuggested && !isPositiveNumber(baseInstrumentId)) {
        return EMPTY_RESOLUTION;
    }

    if (isGeneric && !isNotEmptyString(currencyCode)) {
        return NOT_READY_RESOLUTION;
    }

    return AsyncResult.getOrElse(result, () => NOT_READY_RESOLUTION);
};
