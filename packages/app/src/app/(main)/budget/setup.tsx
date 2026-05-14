import { BudgetPeriodEnum } from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLingui } from '@lingui/react/macro';
import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

import { FormPage } from '../../../@generic/component/form-page/form-page';
import { LoadingScreen } from '../../../@generic/component/loading-screen/loading-screen';
import { ModalFormCancelButton } from '../../../@generic/component/modal-form-cancel-button/modal-form-cancel-button';
import { ModalFormSaveButton } from '../../../@generic/component/modal-form-save-button/modal-form-save-button';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { convertToMicroUnits } from '../../../@generic/utils/convert-to-micro-units.util';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { BudgetSelector } from '../../../budget/budget.selector';
import { BudgetCategoryLimitsField } from '../../../budget/components/budget-category-limits-field/budget-category-limits-field';
import { BudgetNameField } from '../../../budget/components/budget-name-field/budget-name-field';
import { BudgetOverallLimitField } from '../../../budget/components/budget-overall-limit-field/budget-overall-limit-field';
import { BudgetPeriodStartDayField } from '../../../budget/components/budget-period-start-day-field/budget-period-start-day-field';
import { BudgetPushEnabledField } from '../../../budget/components/budget-push-enabled-field/budget-push-enabled-field';
import { BudgetUseLastDayField } from '../../../budget/components/budget-use-last-day-field/budget-use-last-day-field';
import { BudgetFormSchema, BudgetFormValues } from '../../../budget/constant/budget-form-schema.constant';
import { useGetActiveBudgetQuery } from '../../../budget/query/use-get-active-budget.query';
import { useGetBudgetCategoryLimitsQuery } from '../../../budget/query/use-get-budget-category-limits.query';
import { budgetService } from '../../../budget/service/budget.service';

const DEFAULT_PERIOD_START_DAY = 1;
const FORM_CONTENT_STYLE = { rowGap: 24 } as const;

const handleCancel = () => void goBackOrReplace('/');

// eslint-disable-next-line max-statements, max-lines-per-function -- Form orchestration component with multiple hooks and handlers
export default function BudgetSetupScreen() {
    const { t } = useLingui();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const editingId = isDefined(id) ? Number(id) : null;
    const isEditing = isPositiveNumber(editingId);

    const { budget, isLoading } = useGetActiveBudgetQuery();
    const { categoryLimits, isLoading: isCategoryLimitsLoading } = useGetBudgetCategoryLimitsQuery(
        isEditing && isDefined(budget) ? budget.id : null
    );

    const form = useForm<BudgetFormValues>({
        mode: 'onChange',
        resolver: zodResolver(BudgetFormSchema),
        defaultValues: {
            name: t`Monthly Budget`,
            periodStartDay: DEFAULT_PERIOD_START_DAY,
            useLastDayOfMonth: false,
            overallLimit: 0,
            categoryLimits: [],
            pushEnabled: false
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
                pushEnabled: budget.pushEnabled
            });
        }
    }, [isEditing, budget, categoryLimits, isCategoryLimitsLoading, form]);

    const useLastDay = useWatch({ control: form.control, name: 'useLastDayOfMonth' });
    const { isValid } = form.formState;

    if (isEditing && (isLoading || isCategoryLimitsLoading)) {
        return <LoadingScreen />;
    }

    const headerTitle = isEditing ? t`Edit budget` : t`Create budget`;

    const handleSubmit = form.handleSubmit(async values => {
        try {
            const payload = {
                name: values.name,
                period: BudgetPeriodEnum.MONTHLY,
                periodStartDay: values.periodStartDay,
                useLastDayOfMonth: values.useLastDayOfMonth,
                overallLimit: convertToMicroUnits(values.overallLimit),
                pushEnabled: values.pushEnabled,
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

            goBackOrReplace('/');
        } catch (error: unknown) {
            const errorMessage = isEditing ? t`Could not save budget` : t`Could not create budget`;
            Toast.show({ type: 'error', text1: errorMessage, text2: getErrorMessage(error) });
        }
    });

    const footer = (
        <View className="flex-row gap-x-md">
            <ModalFormCancelButton onPress={handleCancel} />
            <ModalFormSaveButton testID={BudgetSelector.SetupSaveButton} onPress={handleSubmit} disabled={!isValid} />
        </View>
    );

    return (
        <FormProvider {...form}>
            <FormPage
                header={<PageHeader title={headerTitle} onGoBack={handleCancel} />}
                footer={footer}
                contentContainerStyle={FORM_CONTENT_STYLE}
            >
                <BudgetNameField control={form.control} />
                <BudgetOverallLimitField control={form.control} autoFocus={!isEditing} />
                <BudgetUseLastDayField control={form.control} />
                {useLastDay ? null : <BudgetPeriodStartDayField control={form.control} />}
                <BudgetPushEnabledField control={form.control} />
                <BudgetCategoryLimitsField />
            </FormPage>
        </FormProvider>
    );
}
