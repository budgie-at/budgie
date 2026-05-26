import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { FormPage } from '../../../../@generic/component/form-page/form-page';
import { ModalFormCancelButton } from '../../../../@generic/component/modal-form-cancel-button/modal-form-cancel-button';
import { ModalFormSaveButton } from '../../../../@generic/component/modal-form-save-button/modal-form-save-button';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../../@generic/utils/go-back-or-replace.util';
import { BudgetSelector } from '../../../../budget/budget.selector';
import { BudgetAllocationSummary } from '../../../../budget/components/budget-allocation-summary/budget-allocation-summary';
import { BudgetCategoryLimitsNavCard } from '../../../../budget/components/budget-category-limits-nav-card/budget-category-limits-nav-card';
import { BudgetCurrencyChip } from '../../../../budget/components/budget-currency-chip/budget-currency-chip';
import { BudgetNameField } from '../../../../budget/components/budget-name-field/budget-name-field';
import { BudgetOverallLimitField } from '../../../../budget/components/budget-overall-limit-field/budget-overall-limit-field';
import { BudgetPeriodStartDayField } from '../../../../budget/components/budget-period-start-day-field/budget-period-start-day-field';
import { BudgetPushEnabledField } from '../../../../budget/components/budget-push-enabled-field/budget-push-enabled-field';
import { BudgetUseLastDayField } from '../../../../budget/components/budget-use-last-day-field/budget-use-last-day-field';
import { BudgetWidgetEnabledField } from '../../../../budget/components/budget-widget-enabled-field/budget-widget-enabled-field';
import { BudgetFormValues } from '../../../../budget/constant/budget-form-schema.constant';
import { useBudgetFormActions } from '../../../../budget/context/budget-form-actions.context';

const FORM_CONTENT_STYLE = { rowGap: 24 } as const;

const handleCancel = () => void goBackOrReplace('/');

export default function BudgetSetupScreen() {
    const { t } = useLingui();
    const { control, formState } = useFormContext<BudgetFormValues>();
    const { handleSubmit, isEditing } = useBudgetFormActions();

    const useLastDay = useWatch<BudgetFormValues, 'useLastDayOfMonth'>({ control, name: 'useLastDayOfMonth' });
    const instrumentId = useWatch<BudgetFormValues, 'instrumentId'>({ control, name: 'instrumentId' });

    const headerTitle = isEditing ? t`Edit budget` : t`Create budget`;
    const currencyChip = isPositiveNumber(instrumentId) ? <BudgetCurrencyChip instrumentId={instrumentId} /> : null;

    const footer = (
        <View className="gap-y-md">
            <BudgetAllocationSummary />
            <View className="flex-row gap-x-md">
                <ModalFormCancelButton onPress={handleCancel} />
                <ModalFormSaveButton testID={BudgetSelector.SetupSaveButton} onPress={handleSubmit} disabled={!formState.isValid} />
            </View>
        </View>
    );

    return (
        <FormPage
            header={<PageHeader title={headerTitle} onGoBack={handleCancel} />}
            footer={footer}
            contentContainerStyle={FORM_CONTENT_STYLE}
        >
            <BudgetNameField control={control} />
            <BudgetOverallLimitField control={control} autoFocus={!isEditing} />
            {currencyChip}
            <BudgetUseLastDayField control={control} />
            {useLastDay ? null : <BudgetPeriodStartDayField control={control} />}
            <BudgetPushEnabledField control={control} />
            <BudgetWidgetEnabledField control={control} />
            <BudgetCategoryLimitsNavCard />
        </FormPage>
    );
}
