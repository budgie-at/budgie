import { useLingui } from '@lingui/react/macro';
import { useLocalSearchParams } from 'expo-router';
import { FormProvider, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { FormPage } from '../../../@generic/component/form-page/form-page';
import { LoadingScreen } from '../../../@generic/component/loading-screen/loading-screen';
import { ModalFormCancelButton } from '../../../@generic/component/modal-form-cancel-button/modal-form-cancel-button';
import { ModalFormSaveButton } from '../../../@generic/component/modal-form-save-button/modal-form-save-button';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { BudgetSelector } from '../../../budget/budget.selector';
import { BudgetCategoryLimitsField } from '../../../budget/components/budget-category-limits-field/budget-category-limits-field';
import { BudgetCurrencyChip } from '../../../budget/components/budget-currency-chip/budget-currency-chip';
import { BudgetNameField } from '../../../budget/components/budget-name-field/budget-name-field';
import { BudgetOverallLimitField } from '../../../budget/components/budget-overall-limit-field/budget-overall-limit-field';
import { BudgetPeriodStartDayField } from '../../../budget/components/budget-period-start-day-field/budget-period-start-day-field';
import { BudgetPushEnabledField } from '../../../budget/components/budget-push-enabled-field/budget-push-enabled-field';
import { BudgetUseLastDayField } from '../../../budget/components/budget-use-last-day-field/budget-use-last-day-field';
import { BudgetWidgetEnabledField } from '../../../budget/components/budget-widget-enabled-field/budget-widget-enabled-field';
import { useBudgetForm } from '../../../budget/hooks/use-budget-form.hook';

const FORM_CONTENT_STYLE = { rowGap: 24 } as const;

const handleCancel = () => void goBackOrReplace('/');

export default function BudgetSetupScreen() {
    const { t } = useLingui();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const editingId = isDefined(id) ? Number(id) : null;

    const { form, handleSubmit, isEditing, isLoading } = useBudgetForm({ editingId });

    const useLastDay = useWatch({ control: form.control, name: 'useLastDayOfMonth' });
    const instrumentId = useWatch({ control: form.control, name: 'instrumentId' });
    const { isValid } = form.formState;

    if (isLoading) {
        return <LoadingScreen />;
    }

    const headerTitle = isEditing ? t`Edit budget` : t`Create budget`;
    const currencyChip = isPositiveNumber(instrumentId) ? <BudgetCurrencyChip instrumentId={instrumentId} /> : null;

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
                {currencyChip}
                <BudgetUseLastDayField control={form.control} />
                {useLastDay ? null : <BudgetPeriodStartDayField control={form.control} />}
                <BudgetPushEnabledField control={form.control} />
                <BudgetWidgetEnabledField control={form.control} />
                <BudgetCategoryLimitsField />
            </FormPage>
        </FormProvider>
    );
}
