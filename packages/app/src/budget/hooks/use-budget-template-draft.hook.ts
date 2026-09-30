import { BudgetTemplateService } from '@budgie/budget';
import { CategoryEntityTable, CategoryRepository } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';

import { isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';
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

const genericBudgetTemplateAtom = Atom.family((currencyCode: string) =>
    databaseQueryAtom(
        [CategoryEntityTable],
        Effect.gen(function* () {
            const categoryRepository = yield* CategoryRepository;
            const budgetTemplateService = yield* BudgetTemplateService;
            const categories = yield* categoryRepository.findAllNonSystem();

            return budgetTemplateService.resolveGenericBudgetTemplate(categories, currencyCode);
        })
    )
);

export const useBudgetTemplateDraft = (kind: BudgetTemplateKindEnum | null): BudgetTemplateResolutionInterface => {
    const defaultInstrumentId = useSetting('defaultInstrumentId');
    const instrumentId = isPositiveNumber(defaultInstrumentId) ? defaultInstrumentId : 0;

    const suggested = useSuggestedBudgetTemplate();
    const { instrument } = useGetInstrumentByIdQuery(instrumentId);
    const currencyCode = isDefined(instrument) ? instrument.code : '';
    const genericResult = useAtomValue(genericBudgetTemplateAtom(currencyCode));

    if (kind === BudgetTemplateKindEnum.SUGGESTED) {
        return suggested;
    }

    if (kind === BudgetTemplateKindEnum.GENERIC) {
        const isGenericReady = !AsyncResult.isInitial(genericResult) && isNotEmptyString(currencyCode);

        if (!isGenericReady) {
            return { draft: ZERO_BUDGET_TEMPLATE_DRAFT, isReady: false, isAvailable: false, stats: null };
        }

        const draft = AsyncResult.getOrElse(genericResult, () => ZERO_BUDGET_TEMPLATE_DRAFT);

        return { draft, isReady: true, isAvailable: isNotEmptyArray(draft.categoryLimits), stats: null };
    }

    return EMPTY_RESOLUTION;
};
