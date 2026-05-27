import { UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FormProvider } from 'react-hook-form';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../../@generic/component/button/button';
import { FormPage } from '../../../../@generic/component/form-page/form-page';
import { LoadingScreen } from '../../../../@generic/component/loading-screen/loading-screen';
import { ModalFormCancelButton } from '../../../../@generic/component/modal-form-cancel-button/modal-form-cancel-button';
import { ModalFormSaveButton } from '../../../../@generic/component/modal-form-save-button/modal-form-save-button';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../../@generic/utils/go-back-or-replace.util';
import { BudgetSelector } from '../../../../budget/budget.selector';
import { BudgetAllocationSummary } from '../../../../budget/components/budget-allocation-summary/budget-allocation-summary';
import { BudgetInlineCategoryLimits } from '../../../../budget/components/budget-inline-category-limits/budget-inline-category-limits';
import { BudgetOverallLimitField } from '../../../../budget/components/budget-overall-limit-field/budget-overall-limit-field';
import { BudgetProgressBar } from '../../../../budget/components/budget-progress-bar/budget-progress-bar';
import { BudgetPushEnabledField } from '../../../../budget/components/budget-push-enabled-field/budget-push-enabled-field';
import { BudgetWidgetEnabledField } from '../../../../budget/components/budget-widget-enabled-field/budget-widget-enabled-field';
import { useBudgetForm } from '../../../../budget/hooks/use-budget-form.hook';
import { useGetBudgetSpentQuery } from '../../../../budget/query/use-get-budget-spent.query';
import { useSetting } from '../../../../settings/hook/use-setting.hook';

const FORM_CONTENT_STYLE = { rowGap: 24 } as const;

const handleCancel = () => void goBackOrReplace('/');
const handleOpenSettings = () => void router.push('/settings');

// eslint-disable-next-line max-statements -- Form orchestration screen owns form state, mount-time precondition, derived UI, and editing-only delete affordance
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
        return (
            <View className="bg-primary-reverse flex-1 items-center justify-center gap-y-xl px-3xl">
                <Text className="text-primary-foreground text-lg font-semibold text-center">
                    <Trans>Set a default currency in Settings first</Trans>
                </Text>
                <Button variant="primary" content={t`Open settings`} onPress={handleOpenSettings} />
            </View>
        );
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
            content={t`Delete budget`}
            onPress={onDeletePress}
        />
    ) : null;

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
        <FormProvider {...form}>
            <FormPage
                header={<PageHeader title={headerTitle} onGoBack={handleCancel} />}
                footer={footer}
                contentContainerStyle={FORM_CONTENT_STYLE}
            >
                {progressBar}
                <BudgetOverallLimitField control={control} autoFocus={!isEditing} />
                <BudgetPushEnabledField control={control} />
                <BudgetWidgetEnabledField control={control} />
                <BudgetInlineCategoryLimits />
                {deleteButton}
            </FormPage>
        </FormProvider>
    );
}
