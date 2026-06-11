import { budgetTemplateService } from '@budgie/budget';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { categoryRepository } from '../../@generic/drizzle/db/db';
import { useGetInstrumentByIdQuery } from '../../instrument/query/use-get-instrument-by-id.query';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { BudgetTemplateKindEnum } from '../enum/budget-template-kind.enum';

import { useSuggestedBudgetTemplate } from './use-suggested-budget-template.hook';

import type { BudgetTemplateDraftInterface, BudgetTemplateResolutionInterface } from '@budgie/budget';

const ZERO_BUDGET_TEMPLATE_DRAFT: BudgetTemplateDraftInterface = { overallLimit: 0, categoryLimits: [] };

const EMPTY_RESOLUTION: BudgetTemplateResolutionInterface = {
    draft: ZERO_BUDGET_TEMPLATE_DRAFT,
    isReady: true,
    isAvailable: false,
    stats: null
};

export const useBudgetTemplateDraft = (kind: BudgetTemplateKindEnum | null): BudgetTemplateResolutionInterface => {
    const defaultInstrumentId = useSetting('defaultInstrumentId');
    const instrumentId = isPositiveNumber(defaultInstrumentId) ? defaultInstrumentId : 0;

    const suggested = useSuggestedBudgetTemplate();
    const { instrument } = useGetInstrumentByIdQuery(instrumentId);
    const { data: categoriesData, updatedAt: categoriesUpdatedAt } = useLiveQuery(categoryRepository.findAllNonSystem(), []);

    if (kind === BudgetTemplateKindEnum.SUGGESTED) {
        return suggested;
    }

    if (kind === BudgetTemplateKindEnum.GENERIC) {
        const currencyCode = isDefined(instrument) ? instrument.code : '';
        const isGenericReady = isDefined(categoriesUpdatedAt) && isNotEmptyString(currencyCode);

        if (!isGenericReady) {
            return { draft: ZERO_BUDGET_TEMPLATE_DRAFT, isReady: false, isAvailable: false, stats: null };
        }

        const draft = budgetTemplateService.resolveGenericBudgetTemplate(categoriesData, currencyCode);

        return { draft, isReady: true, isAvailable: isNotEmptyArray(draft.categoryLimits), stats: null };
    }

    return EMPTY_RESOLUTION;
};
