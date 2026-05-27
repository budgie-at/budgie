import { BudgetPeriodEnum } from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLingui } from '@lingui/react/macro';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { goBackOrReplace } from '../../@generic/utils/go-back-or-replace.util';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { updateSettingsMutation } from '../../settings/mutation/update-settings.mutation';
import { BudgetFormSchema, BudgetFormValues } from '../constant/budget-form-schema.constant';
import { useGetActiveBudgetQuery } from '../query/use-get-active-budget.query';
import { useGetBudgetCategoryLimitsQuery } from '../query/use-get-budget-category-limits.query';
import { budgetService } from '../service/budget.service';

const DEFAULT_PERIOD_START_DAY = 1;

interface UseBudgetFormOptionsInterface {
    readonly editingId: number | null;
}

// eslint-disable-next-line max-lines-per-function -- Form orchestration hook owns defaults, reset effect, delete confirmation, and submit lifecycle
export const useBudgetForm = ({ editingId }: UseBudgetFormOptionsInterface) => {
    const { t } = useLingui();
    const isEditing = isPositiveNumber(editingId);

    const { budget, isLoading } = useGetActiveBudgetQuery();
    const { categoryLimits, isLoading: isCategoryLimitsLoading } = useGetBudgetCategoryLimitsQuery(
        isEditing && isDefined(budget) ? budget.id : null
    );
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

    useEffect(() => {
        if (isEditing && isDefined(budget) && !isCategoryLimitsLoading) {
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
        }
    }, [isEditing, budget, categoryLimits, isCategoryLimitsLoading, form]);

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

    const handleSubmit = form.handleSubmit(async values => {
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
                await updateSettingsMutation({ isBudgetWidgetEnabled: true });
            }

            goBackOrReplace('/');
        } catch (error: unknown) {
            const errorMessage = isEditing ? t`Could not save budget` : t`Could not create budget`;
            Toast.show({ type: 'error', text1: errorMessage, text2: getErrorMessage(error) });
        }
    });

    return {
        form,
        handleSubmit,
        handleDelete,
        isEditing,
        budget,
        isLoading: isEditing && (isLoading || isCategoryLimitsLoading)
    };
};
