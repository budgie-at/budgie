import { BudgetSinkingFundRepository } from '@budgie/budget';
import { convertFromMicroUnits } from '@budgie/contracts';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useLingui } from '@lingui/react/macro';
import { addMonths } from 'date-fns/addMonths';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { useForm, useWatch } from 'react-hook-form';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useSingleFlight } from '../../@generic/hook/use-single-flight.hook';
import { useToday } from '../../@generic/hook/use-today.hook';
import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { goBackOrReplace } from '../../@generic/utils/go-back-or-replace.util';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { BudgetFundFormSchema, BudgetFundFormValues } from '../constant/budget-fund-form-schema.constant';
import { FUND_YEARLY_MONTHS } from '../constant/budget-fund-repeat-months.constant';
import { useGetBudgetFundSuggestionsQuery } from '../query/use-get-budget-fund-suggestions.query';
import { useGetBudgetFundsQuery } from '../query/use-get-budget-funds.query';
import { buildBudgetFundPayload } from '../utils/build-budget-fund-payload.util';

import type { BudgetFundSuggestionInterface } from '../interface/budget-fund-suggestion.interface';
import type { BudgetEntityInterface, BudgetSinkingFundEntityInterface } from '@budgie/contracts';

const FALLBACK_ROUTE = '/budget' as const;

interface UseBudgetFundFormOptionsInterface {
    readonly budget: Pick<BudgetEntityInterface, 'id' | 'instrumentId'>;
    readonly editingId: number | null;
}

const buildFundFormValues = (fund: BudgetSinkingFundEntityInterface): BudgetFundFormValues => ({
    name: fund.name,
    categoryId: fund.categoryId,
    targetAmount: convertFromMicroUnits(fund.targetAmount),
    dueAtMs: fund.dueAt.getTime(),
    repeatEveryMonths: fund.repeatEveryMonths,
    recurringSeriesId: fund.recurringSeriesId
});

export const useBudgetFundForm = ({ budget, editingId }: UseBudgetFundFormOptionsInterface) => {
    const { t } = useLingui();
    const { run } = useSingleFlight();
    const today = useToday();
    const isEditing = isPositiveNumber(editingId);
    const { funds } = useGetBudgetFundsQuery(budget.id);
    const editingFund = funds.find(fund => fund.id === editingId);
    const suggestions = useGetBudgetFundSuggestionsQuery(budget.id, budget.instrumentId);

    const defaultValues: BudgetFundFormValues = {
        name: '',
        categoryId: 0,
        targetAmount: 0,
        dueAtMs: addMonths(today, FUND_YEARLY_MONTHS).getTime(),
        repeatEveryMonths: FUND_YEARLY_MONTHS,
        recurringSeriesId: null
    };

    const form = useForm<BudgetFundFormValues>({
        mode: 'onChange',
        resolver: standardSchemaResolver(Schema.toStandardSchemaV1(BudgetFundFormSchema)),
        defaultValues,
        values: isDefined(editingFund) ? buildFundFormValues(editingFund) : defaultValues,
        resetOptions: { keepDirtyValues: true, keepErrors: true }
    });

    const recurringSeriesId = useWatch({ control: form.control, name: 'recurringSeriesId' });

    const handleUseSuggestion = (suggestion: BudgetFundSuggestionInterface) => {
        form.reset({
            name: suggestion.name,
            categoryId: suggestion.categoryId,
            targetAmount: convertFromMicroUnits(suggestion.targetAmount),
            dueAtMs: suggestion.dueAt.getTime(),
            repeatEveryMonths: suggestion.repeatEveryMonths,
            recurringSeriesId: suggestion.recurringSeriesId
        });
    };

    const handleSubmit = () => {
        void form.handleSubmit(values =>
            run(
                Effect.gen(function* () {
                    const budgetSinkingFundRepository = yield* BudgetSinkingFundRepository;
                    const payload = buildBudgetFundPayload(values, budget.id);

                    if (isPositiveNumber(editingId)) {
                        yield* budgetSinkingFundRepository.update(editingId, {
                            name: payload.name,
                            categoryId: payload.categoryId,
                            targetAmount: payload.targetAmount,
                            dueAt: payload.dueAt,
                            repeatEveryMonths: payload.repeatEveryMonths
                        });
                    } else {
                        yield* budgetSinkingFundRepository.create(payload);
                    }

                    goBackOrReplace(FALLBACK_ROUTE);
                }).pipe(toastOnFailure(isEditing ? t`Could not save fund` : t`Could not create fund`))
            )
        )();
    };

    const handleDelete = () => {
        void run(
            Effect.gen(function* () {
                const confirmed = yield* confirmAlert({
                    title: t`Delete fund?`,
                    message: t`Budgie stops setting money aside for it. Your transactions are not affected.`,
                    confirmText: t`Delete`,
                    cancelText: t`Cancel`,
                    isDestructive: true
                });

                if (!confirmed || !isPositiveNumber(editingId)) {
                    return;
                }

                const budgetSinkingFundRepository = yield* BudgetSinkingFundRepository;

                yield* budgetSinkingFundRepository.delete(editingId);
                goBackOrReplace(FALLBACK_ROUTE);
            }).pipe(toastOnFailure(t`Could not delete fund`))
        );
    };

    return {
        form,
        editingFund,
        suggestion: isEditing || isDefined(recurringSeriesId) ? null : (suggestions[0] ?? null),
        handleUseSuggestion,
        handleSubmit,
        handleDelete,
        isEditing
    };
};
