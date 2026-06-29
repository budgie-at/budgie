import { budgetComputeAllocation } from '@budgie/budget';
import { BudgetPeriodEnum } from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLingui } from '@lingui/react/macro';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { goBackOrReplace } from '../../@generic/utils/go-back-or-replace.util';
import { BudgetFormSchema, BudgetFormValues } from '../constant/budget-form-schema.constant';
import { BudgetTemplateKindEnum } from '../enum/budget-template-kind.enum';
import { useGetActiveBudgetQuery } from '../query/use-get-active-budget.query';
import { useGetBudgetCategoryLimitsQuery } from '../query/use-get-budget-category-limits.query';
import { budgetService } from '../service/budget.service';

import { useBudgetTemplateDraft } from './use-budget-template-draft.hook';

import type { BudgetTemplateDraftInterface } from '@budgie/budget';
import type { BudgetCategoryLimitEntityInterface, BudgetEntityInterface } from '@budgie/contracts';

const DEFAULT_PERIOD_START_DAY = 1;
const EDITING_FALLBACK_ROUTE = '/budget' as const;
const DEFAULT_FALLBACK_ROUTE = '/' as const;

interface UseBudgetFormOptionsInterface {
    readonly defaultInstrumentId: number;
    readonly editingId: number | null;
    readonly templateKind?: BudgetTemplateKindEnum | null;
}

const buildBudgetFormValues = (
    budget: BudgetEntityInterface,
    categoryLimits: readonly BudgetCategoryLimitEntityInterface[]
): BudgetFormValues => ({
    name: budget.name,
    periodStartDay: budget.periodStartDay,
    useLastDayOfMonth: budget.useLastDayOfMonth,
    overallLimit: convertFromMicroUnits(budget.overallLimit),
    otherLimit: convertFromMicroUnits(budget.otherLimit),
    categoryLimits: categoryLimits.map(limit => ({
        categoryId: limit.categoryId,
        limitAmount: convertFromMicroUnits(limit.limitAmount)
    })),
    instrumentId: budget.instrumentId
});

const buildDefaultBudgetFormValues = (name: string, instrumentId: number): BudgetFormValues => ({
    name,
    periodStartDay: DEFAULT_PERIOD_START_DAY,
    useLastDayOfMonth: false,
    overallLimit: 0,
    otherLimit: 0,
    categoryLimits: [],
    instrumentId
});

const buildTemplateBudgetFormValues = (
    name: string,
    defaultInstrumentId: number,
    templateDraft: BudgetTemplateDraftInterface
): BudgetFormValues => {
    const allocation = budgetComputeAllocation({
        overallLimit: templateDraft.overallLimit,
        otherLimit: 0,
        categoryLimits: templateDraft.categoryLimits
    });
    const otherLimit = Math.max(0, allocation.remaining);

    return {
        name,
        periodStartDay: DEFAULT_PERIOD_START_DAY,
        useLastDayOfMonth: false,
        overallLimit: templateDraft.overallLimit,
        otherLimit,
        categoryLimits: templateDraft.categoryLimits.map(limit => ({ ...limit })),
        instrumentId: defaultInstrumentId
    };
};

const areBudgetCategoryLimitsEqual = (left: BudgetFormValues['categoryLimits'], right: BudgetFormValues['categoryLimits']): boolean => {
    if (left.length !== right.length) {
        return false;
    }

    return left.every((leftLimit, index) => {
        const rightLimit = right[index];

        return isDefined(rightLimit) && leftLimit.categoryId === rightLimit.categoryId && leftLimit.limitAmount === rightLimit.limitAmount;
    });
};

const areBudgetFormValuesEqual = (left: BudgetFormValues, right: BudgetFormValues): boolean =>
    left.name === right.name &&
    left.periodStartDay === right.periodStartDay &&
    left.useLastDayOfMonth === right.useLastDayOfMonth &&
    left.overallLimit === right.overallLimit &&
    left.otherLimit === right.otherLimit &&
    left.instrumentId === right.instrumentId &&
    areBudgetCategoryLimitsEqual(left.categoryLimits, right.categoryLimits);

// eslint-disable-next-line max-lines-per-function -- Form orchestration hook owns edit/template seeding, delete confirmation, and submit lifecycle
export const useBudgetForm = ({ defaultInstrumentId, editingId, templateKind = null }: UseBudgetFormOptionsInterface) => {
    const { t } = useLingui();
    const isEditing = isPositiveNumber(editingId);
    const hasAsyncTemplate = isDefined(templateKind) && templateKind !== BudgetTemplateKindEnum.EMPTY;
    const { budget, isLoading: isBudgetLoading } = useGetActiveBudgetQuery();
    const categoryLimitsBudgetId = isEditing && isDefined(budget) ? budget.id : null;
    const { categoryLimits: loadedCategoryLimits, isLoading: isCategoryLimitsLoading } =
        useGetBudgetCategoryLimitsQuery(categoryLimitsBudgetId);
    const { draft: templateDraft, isReady: isTemplateReady } = useBudgetTemplateDraft(isEditing ? null : templateKind);

    const defaultFormValues = useMemo(() => buildDefaultBudgetFormValues(t`Monthly Budget`, defaultInstrumentId), [defaultInstrumentId, t]);
    const formValues = useMemo(() => {
        if (isEditing && isDefined(budget) && !isCategoryLimitsLoading) {
            return buildBudgetFormValues(budget, loadedCategoryLimits);
        }

        if (!isEditing && hasAsyncTemplate && isTemplateReady) {
            return buildTemplateBudgetFormValues(t`Monthly Budget`, defaultInstrumentId, templateDraft);
        }

        return defaultFormValues;
    }, [
        budget,
        defaultFormValues,
        defaultInstrumentId,
        hasAsyncTemplate,
        isCategoryLimitsLoading,
        isEditing,
        isTemplateReady,
        loadedCategoryLimits,
        t,
        templateDraft
    ]);

    const form = useForm<BudgetFormValues>({
        mode: 'onChange',
        resolver: zodResolver(BudgetFormSchema),
        defaultValues: defaultFormValues,
        values: formValues,
        resetOptions: {
            keepDirtyValues: true,
            keepErrors: true
        }
    });
    const isFormSyncing =
        (isEditing || hasAsyncTemplate) && !form.formState.isDirty && !areBudgetFormValuesEqual(form.getValues(), formValues);

    const handleDelete = async () => {
        if (!isDefined(budget)) {
            return;
        }
        const confirmed = await confirmAlert({
            title: t`Delete budget?`,
            message: t`This will remove your monthly budget. You can create a new one anytime.`,
            confirmText: t`Delete`,
            cancelText: t`Cancel`,
            isDestructive: true
        });
        if (!confirmed) {
            return;
        }
        try {
            await budgetService.deleteBudget(budget.id);
            goBackOrReplace('/');
        } catch (error: unknown) {
            Toast.show({ type: 'error', text1: t`Could not delete budget`, text2: getErrorMessage(error) });
        }
    };

    const handleCancel = () => {
        if (isEditing && isDefined(budget)) {
            form.reset(buildBudgetFormValues(budget, loadedCategoryLimits));
        }
        const fallbackRoute = isEditing ? EDITING_FALLBACK_ROUTE : DEFAULT_FALLBACK_ROUTE;
        goBackOrReplace(fallbackRoute);
    };

    const handleSubmit = () => {
        if (isPositiveNumber(defaultInstrumentId) && !isPositiveNumber(form.getValues('instrumentId'))) {
            form.setValue('instrumentId', defaultInstrumentId, { shouldDirty: false, shouldTouch: false, shouldValidate: true });
        }

        void form.handleSubmit(async values => {
            try {
                const basePayload = {
                    name: values.name,
                    period: BudgetPeriodEnum.MONTHLY,
                    periodStartDay: values.periodStartDay,
                    useLastDayOfMonth: values.useLastDayOfMonth,
                    overallLimit: convertToMicroUnits(values.overallLimit),
                    otherLimit: convertToMicroUnits(values.otherLimit),
                    instrumentId: values.instrumentId,
                    categoryLimits: values.categoryLimits.map(limit => ({
                        categoryId: limit.categoryId,
                        limitAmount: convertToMicroUnits(limit.limitAmount)
                    }))
                };

                if (isPositiveNumber(editingId)) {
                    await budgetService.updateBudget(editingId, basePayload);
                } else {
                    await budgetService.createBudget(basePayload);
                }

                const fallbackRoute = isEditing ? EDITING_FALLBACK_ROUTE : DEFAULT_FALLBACK_ROUTE;
                goBackOrReplace(fallbackRoute);
            } catch (error: unknown) {
                const errorMessage = isEditing ? t`Could not save budget` : t`Could not create budget`;
                Toast.show({ type: 'error', text1: errorMessage, text2: getErrorMessage(error) });
            }
        })();
    };

    return {
        form,
        handleCancel,
        handleSubmit,
        handleDelete,
        isEditing,
        budget,
        isLoading:
            (isEditing && (isBudgetLoading || isCategoryLimitsLoading || !isDefined(budget))) ||
            (!isEditing && hasAsyncTemplate && !isTemplateReady) ||
            isFormSyncing
    };
};
