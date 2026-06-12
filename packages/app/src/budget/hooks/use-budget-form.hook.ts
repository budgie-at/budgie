import { budgetAllocationService } from '@budgie/budget';
import { BudgetPeriodEnum } from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';

import { emptyFn, getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

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

import type { BudgetCategoryLimitEntityInterface, BudgetEntityInterface } from '@budgie/contracts';
import type { UseFormReturn } from 'react-hook-form';

const DEFAULT_PERIOD_START_DAY = 1;
const EDITING_FALLBACK_ROUTE = '/budget' as const;
const DEFAULT_FALLBACK_ROUTE = '/' as const;

interface UseBudgetFormOptionsInterface {
    readonly defaultInstrumentId: number;
    readonly editingId: number | null;
    readonly templateKind?: BudgetTemplateKindEnum | null;
}

const resetBudgetForm = (
    form: UseFormReturn<BudgetFormValues>,
    budget: BudgetEntityInterface,
    categoryLimits: readonly BudgetCategoryLimitEntityInterface[]
): void => {
    form.reset({
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
};

// eslint-disable-next-line max-lines-per-function, max-statements -- Form orchestration hook owns edit + template seed effects, delete confirmation, and submit lifecycle
export const useBudgetForm = ({ defaultInstrumentId, editingId, templateKind = null }: UseBudgetFormOptionsInterface) => {
    const { t } = useLingui();
    const isEditing = isPositiveNumber(editingId);
    const hasAsyncTemplate = isDefined(templateKind) && templateKind !== BudgetTemplateKindEnum.EMPTY;
    const isSeedDriven = isEditing || hasAsyncTemplate;
    const [isFormHydrated, setIsFormHydrated] = useState(!isSeedDriven);

    const { budget, isLoading: isBudgetLoading } = useGetActiveBudgetQuery();
    const categoryLimitsBudgetId = isEditing && isDefined(budget) ? budget.id : null;
    const { categoryLimits: loadedCategoryLimits, isLoading: isCategoryLimitsLoading } =
        useGetBudgetCategoryLimitsQuery(categoryLimitsBudgetId);
    const { draft: templateDraft, isReady: isTemplateReady } = useBudgetTemplateDraft(isEditing ? null : templateKind);

    const form = useForm<BudgetFormValues>({
        mode: 'onChange',
        resolver: zodResolver(BudgetFormSchema),
        defaultValues: {
            name: t`Monthly Budget`,
            periodStartDay: DEFAULT_PERIOD_START_DAY,
            useLastDayOfMonth: false,
            overallLimit: 0,
            otherLimit: 0,
            categoryLimits: [],
            instrumentId: defaultInstrumentId
        }
    });

    useEffect(() => {
        if (!isEditing || !isDefined(budget) || isCategoryLimitsLoading || form.formState.isDirty || isFormHydrated) {
            return emptyFn;
        }

        resetBudgetForm(form, budget, loadedCategoryLimits);
        queueMicrotask(() => void setIsFormHydrated(true));

        return emptyFn;
    }, [budget, form, form.formState.isDirty, isCategoryLimitsLoading, isEditing, isFormHydrated, loadedCategoryLimits]);

    useEffect(() => {
        if (isEditing || !hasAsyncTemplate || isFormHydrated || form.formState.isDirty) {
            return emptyFn;
        }

        if (!isTemplateReady) {
            return emptyFn;
        }

        const allocation = budgetAllocationService.computeAllocation({
            overallLimit: templateDraft.overallLimit,
            otherLimit: 0,
            categoryLimits: templateDraft.categoryLimits
        });
        const otherLimit = Math.max(0, allocation.remaining);

        form.reset({
            name: t`Monthly Budget`,
            periodStartDay: DEFAULT_PERIOD_START_DAY,
            useLastDayOfMonth: false,
            overallLimit: templateDraft.overallLimit,
            otherLimit,
            categoryLimits: templateDraft.categoryLimits.map(limit => ({ ...limit })),
            instrumentId: defaultInstrumentId
        });
        queueMicrotask(() => void setIsFormHydrated(true));

        return emptyFn;
    }, [defaultInstrumentId, form, form.formState.isDirty, hasAsyncTemplate, isEditing, isFormHydrated, isTemplateReady, t, templateDraft]);

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
            resetBudgetForm(form, budget, loadedCategoryLimits);
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
        isLoading: (isEditing && (isBudgetLoading || isCategoryLimitsLoading || !isFormHydrated)) || (hasAsyncTemplate && !isFormHydrated)
    };
};
