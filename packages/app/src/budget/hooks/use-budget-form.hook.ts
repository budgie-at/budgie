import { BudgetPeriodEnum } from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLingui } from '@lingui/react/macro';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

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

export const useBudgetForm = ({ editingId }: UseBudgetFormOptionsInterface) => {
    const { t } = useLingui();
    const isEditing = isPositiveNumber(editingId);

    const { budget, isLoading } = useGetActiveBudgetQuery();
    const { categoryLimits, isLoading: isCategoryLimitsLoading } = useGetBudgetCategoryLimitsQuery(
        isEditing && isDefined(budget) ? budget.id : null
    );
    const isWidgetEnabledSetting = useSetting('isBudgetWidgetEnabled');
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
            pushEnabled: false,
            isWidgetEnabled: true,
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
                pushEnabled: budget.pushEnabled,
                isWidgetEnabled: isWidgetEnabledSetting,
                instrumentId: budget.instrumentId
            });
        }
    }, [isEditing, budget, categoryLimits, isCategoryLimitsLoading, isWidgetEnabledSetting, form]);

    const handleSubmit = form.handleSubmit(async values => {
        try {
            if (!isPositiveNumber(values.instrumentId)) {
                Toast.show({
                    type: 'error',
                    text1: t`Could not save budget: a default currency is required.`
                });

                return;
            }

            const payload = {
                name: values.name,
                period: BudgetPeriodEnum.MONTHLY,
                periodStartDay: values.periodStartDay,
                useLastDayOfMonth: values.useLastDayOfMonth,
                overallLimit: convertToMicroUnits(values.overallLimit),
                pushEnabled: values.pushEnabled,
                instrumentId: values.instrumentId,
                categoryLimits: values.categoryLimits.map(limit => ({
                    categoryId: limit.categoryId,
                    limitAmount: convertToMicroUnits(limit.limitAmount)
                }))
            };

            if (isEditing && isPositiveNumber(editingId)) {
                await budgetService.updateBudget(editingId, payload);
            } else {
                await budgetService.createBudget(payload);
            }

            await updateSettingsMutation({ isBudgetWidgetEnabled: values.isWidgetEnabled });

            goBackOrReplace('/');
        } catch (error: unknown) {
            const errorMessage = isEditing ? t`Could not save budget` : t`Could not create budget`;
            Toast.show({ type: 'error', text1: errorMessage, text2: getErrorMessage(error) });
        }
    });

    return {
        form,
        handleSubmit,
        isEditing,
        isLoading: isEditing && (isLoading || isCategoryLimitsLoading)
    };
};
