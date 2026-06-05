import { BudgetCategoryLimitEntityInterface, BudgetPeriodEnum } from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLingui } from '@lingui/react/macro';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';

import { emptyFn, getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

import { budgetCategoryLimitRepository } from '../../@generic/drizzle/db/db';
import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { goBackOrReplace } from '../../@generic/utils/go-back-or-replace.util';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { BudgetFormSchema, BudgetFormValues } from '../constant/budget-form-schema.constant';
import { useGetActiveBudgetQuery } from '../query/use-get-active-budget.query';
import { budgetService } from '../service/budget.service';

const DEFAULT_PERIOD_START_DAY = 1;
const EMPTY_CATEGORY_LIMITS: readonly BudgetCategoryLimitEntityInterface[] = [];
const EDITING_FALLBACK_ROUTE = '/budget' as const;
const DEFAULT_FALLBACK_ROUTE = '/' as const;

interface UseBudgetFormOptionsInterface {
    readonly editingId: number | null;
}

// eslint-disable-next-line max-lines-per-function -- Form orchestration hook owns defaults, reset effect, delete confirmation, and submit lifecycle
export const useBudgetForm = ({ editingId }: UseBudgetFormOptionsInterface) => {
    const { t } = useLingui();
    const isEditing = isPositiveNumber(editingId);
    const [isFormHydrated, setIsFormHydrated] = useState(!isEditing);
    const [hydratedCategoryLimits, setHydratedCategoryLimits] = useState(EMPTY_CATEGORY_LIMITS);

    const { budget, isLoading } = useGetActiveBudgetQuery();
    const defaultInstrumentId = useSetting('defaultInstrumentId');

    const form = useForm<BudgetFormValues>({
        mode: 'onChange',
        resolver: zodResolver(BudgetFormSchema),
        defaultValues: {
            name: t`Monthly Budget`,
            periodStartDay: DEFAULT_PERIOD_START_DAY,
            useLastDayOfMonth: false,
            overallLimit: 0,
            categoryLimits: [],
            instrumentId: isPositiveNumber(defaultInstrumentId) ? defaultInstrumentId : 0
        }
    });

    const ensureInstrumentId = useCallback(() => {
        if (!isPositiveNumber(defaultInstrumentId) || isPositiveNumber(form.getValues('instrumentId'))) {
            return;
        }

        form.setValue('instrumentId', defaultInstrumentId, { shouldDirty: false, shouldTouch: false, shouldValidate: true });
    }, [defaultInstrumentId, form]);

    useEffect(() => {
        if (isEditing) {
            return;
        }

        ensureInstrumentId();
    }, [ensureInstrumentId, isEditing]);

    const resetFormFromBudget = useCallback(
        (categoryLimits: readonly BudgetCategoryLimitEntityInterface[]) => {
            if (!isEditing || !isDefined(budget)) {
                return;
            }

            form.reset({
                name: budget.name,
                periodStartDay: budget.periodStartDay,
                useLastDayOfMonth: budget.useLastDayOfMonth,
                overallLimit: convertFromMicroUnits(budget.overallLimit),
                categoryLimits: categoryLimits.map(limit => ({
                    categoryId: limit.categoryId,
                    limitAmount: convertFromMicroUnits(limit.limitAmount)
                })),
                instrumentId: budget.instrumentId
            });
            setIsFormHydrated(true);
        },
        [isEditing, budget, form]
    );

    useEffect(() => {
        if (!isEditing || !isDefined(budget)) {
            return emptyFn;
        }

        if (form.formState.isDirty || isFormHydrated) {
            return emptyFn;
        }

        let isActive = true;

        const hydrateForm = async () => {
            const categoryLimits = await budgetCategoryLimitRepository.getByBudget(budget.id);

            if (!isActive || form.formState.isDirty) {
                return;
            }

            setHydratedCategoryLimits(categoryLimits);
            resetFormFromBudget(categoryLimits);
        };

        void hydrateForm().catch((error: unknown) => {
            if (isActive) {
                Toast.show({ type: 'error', text1: t`Could not load budget`, text2: getErrorMessage(error) });
                setIsFormHydrated(true);
            }

            return null;
        });

        return () => {
            isActive = false;
        };
    }, [budget, form, form.formState.isDirty, isEditing, isFormHydrated, resetFormFromBudget, t]);

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
        resetFormFromBudget(hydratedCategoryLimits);
        const fallbackRoute = isEditing ? EDITING_FALLBACK_ROUTE : DEFAULT_FALLBACK_ROUTE;
        goBackOrReplace(fallbackRoute);
    };

    const handleSubmit = () => {
        ensureInstrumentId();
        void form.handleSubmit(async values => {
            try {
                const basePayload = {
                    name: values.name,
                    period: BudgetPeriodEnum.MONTHLY,
                    periodStartDay: values.periodStartDay,
                    useLastDayOfMonth: values.useLastDayOfMonth,
                    overallLimit: convertToMicroUnits(values.overallLimit),
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
        isLoading: isEditing && (isLoading || !isFormHydrated)
    };
};
