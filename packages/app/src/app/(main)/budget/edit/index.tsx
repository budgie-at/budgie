import { UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FormProvider, useWatch } from 'react-hook-form';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../../@generic/component/button/button';
import { FormPage } from '../../../../@generic/component/form-page/form-page';
import { LoadingScreen } from '../../../../@generic/component/loading-screen/loading-screen';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { BudgetSelector } from '../../../../budget/budget.selector';
import { BudgetEditFooter } from '../../../../budget/components/budget-edit-footer/budget-edit-footer';
import { BudgetInlineCategoryLimits } from '../../../../budget/components/budget-inline-category-limits/budget-inline-category-limits';
import { BudgetMissingCurrencyGuard } from '../../../../budget/components/budget-missing-currency-guard/budget-missing-currency-guard';
import { BudgetOverallLimitField } from '../../../../budget/components/budget-overall-limit-field/budget-overall-limit-field';
import { BudgetProgressBar } from '../../../../budget/components/budget-progress-bar/budget-progress-bar';
import { BudgetFormSchema } from '../../../../budget/constant/budget-form-schema.constant';
import { useBudgetForm } from '../../../../budget/hooks/use-budget-form.hook';
import { useGetBudgetSpentQuery } from '../../../../budget/query/use-get-budget-spent.query';
import { useSetting } from '../../../../settings/hook/use-setting.hook';

const FORM_CONTENT_STYLE = { rowGap: 24 } as const;

const getFallbackScreen = (isLoading: boolean, defaultInstrumentId: number | null) => {
    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!isPositiveNumber(defaultInstrumentId)) {
        return <BudgetMissingCurrencyGuard />;
    }

    return null;
};

const getDeleteButton = (isEditing: boolean, handleDelete: () => Promise<void>) => {
    const onDeletePress = () => void handleDelete();

    return isEditing ? (
        <Button
            testID={BudgetSelector.SetupDeleteButton}
            variant="destructive"
            leftIcon={UserIconNameEnum.Trash2}
            onPress={onDeletePress}
        />
    ) : null;
};

export default function BudgetSetupScreen() {
    const { id } = useLocalSearchParams<{ id?: string }>();
    const [editingId] = useState<number | null>(() => (isDefined(id) ? Number(id) : null));

    const defaultInstrumentId = useSetting('defaultInstrumentId');
    const { form, handleCancel, handleSubmit, handleDelete, isEditing, isLoading, budget } = useBudgetForm({ editingId });
    const [overallLimit, categoryLimits, watchedInstrumentId] = useWatch({
        control: form.control,
        name: ['overallLimit', 'categoryLimits', 'instrumentId']
    });
    const { spent } = useGetBudgetSpentQuery(budget);
    const instrumentId = isPositiveNumber(watchedInstrumentId) ? watchedInstrumentId : defaultInstrumentId;
    const isSaveDisabled = !BudgetFormSchema.safeParse({ ...form.getValues(), overallLimit, categoryLimits, instrumentId }).success;
    const fallbackScreen = getFallbackScreen(isLoading, defaultInstrumentId);

    if (isDefined(fallbackScreen)) {
        return fallbackScreen;
    }

    const headerTitle = isEditing ? t`Edit budget` : t`Create budget`;
    const progressBar =
        isEditing && isDefined(budget) ? (
            <BudgetProgressBar spent={spent.spentOverall} limit={budget.overallLimit} spentTestID={BudgetSelector.SetupSpentLabel} />
        ) : null;
    const deleteButton = getDeleteButton(isEditing, handleDelete);

    return (
        <FormProvider {...form}>
            <FormPage
                header={<PageHeader title={headerTitle} onGoBack={handleCancel} />}
                footer={<BudgetEditFooter onSubmit={handleSubmit} disabled={isSaveDisabled} deleteButton={deleteButton} />}
                contentContainerStyle={FORM_CONTENT_STYLE}
            >
                {progressBar}
                <BudgetOverallLimitField control={form.control} autoFocus={!isEditing} />
                <BudgetInlineCategoryLimits />
            </FormPage>
        </FormProvider>
    );
}
