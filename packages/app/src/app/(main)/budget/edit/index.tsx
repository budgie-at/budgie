import { UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FormProvider } from 'react-hook-form';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../../@generic/component/button/button';
import { FormPage } from '../../../../@generic/component/form-page/form-page';
import { LoadingScreen } from '../../../../@generic/component/loading-screen/loading-screen';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../../@generic/utils/go-back-or-replace.util';
import { BudgetSelector } from '../../../../budget/budget.selector';
import { BudgetEditFooter } from '../../../../budget/components/budget-edit-footer/budget-edit-footer';
import { BudgetInlineCategoryLimits } from '../../../../budget/components/budget-inline-category-limits/budget-inline-category-limits';
import { BudgetMissingCurrencyGuard } from '../../../../budget/components/budget-missing-currency-guard/budget-missing-currency-guard';
import { BudgetOverallLimitField } from '../../../../budget/components/budget-overall-limit-field/budget-overall-limit-field';
import { BudgetProgressBar } from '../../../../budget/components/budget-progress-bar/budget-progress-bar';
import { useBudgetForm } from '../../../../budget/hooks/use-budget-form.hook';
import { useGetBudgetSpentQuery } from '../../../../budget/query/use-get-budget-spent.query';
import { useSetting } from '../../../../settings/hook/use-setting.hook';

const FORM_CONTENT_STYLE = { rowGap: 24 } as const;

const handleCancel = () => void goBackOrReplace('/');

export default function BudgetSetupScreen() {
    const { id } = useLocalSearchParams<{ id?: string }>();
    const [editingId] = useState<number | null>(() => (isDefined(id) ? Number(id) : null));

    const defaultInstrumentId = useSetting('defaultInstrumentId');
    const { form, handleSubmit, handleDelete, isEditing, isLoading, budget } = useBudgetForm({ editingId });
    const { spent } = useGetBudgetSpentQuery(budget);

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!isPositiveNumber(defaultInstrumentId)) {
        return <BudgetMissingCurrencyGuard />;
    }

    const { control, formState } = form;
    const headerTitle = isEditing ? t`Edit budget` : t`Create budget`;
    const onDeletePress = () => void handleDelete();
    const progressBar =
        isEditing && isDefined(budget) ? (
            <BudgetProgressBar spent={spent.spentOverall} limit={budget.overallLimit} spentTestID={BudgetSelector.SetupSpentLabel} />
        ) : null;
    const deleteButton = isEditing ? (
        <Button
            testID={BudgetSelector.SetupDeleteButton}
            variant="destructive"
            leftIcon={UserIconNameEnum.Trash2}
            onPress={onDeletePress}
        />
    ) : null;

    return (
        <FormProvider {...form}>
            <FormPage
                header={<PageHeader title={headerTitle} onGoBack={handleCancel} />}
                footer={<BudgetEditFooter onSubmit={handleSubmit} disabled={!formState.isValid} deleteButton={deleteButton} />}
                contentContainerStyle={FORM_CONTENT_STYLE}
            >
                {progressBar}
                <BudgetOverallLimitField control={control} autoFocus={!isEditing} />
                <BudgetInlineCategoryLimits />
            </FormPage>
        </FormProvider>
    );
}
