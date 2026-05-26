import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FormProvider } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { LoadingScreen } from '../../../../@generic/component/loading-screen/loading-screen';
import { ScreenLayout } from '../../../../@generic/component/screen-layout/screen-layout';
import { DEFAULT_STACK_OPTIONS } from '../../../../@generic/constant/default-stack-options.constant';
import { BudgetFormActionsContext } from '../../../../budget/context/budget-form-actions.context';
import { useBudgetForm } from '../../../../budget/hooks/use-budget-form.hook';

export default function BudgetEditLayout() {
    const params = useLocalSearchParams<{ id?: string }>();
    const [editingId] = useState<number | null>(() => (isDefined(params.id) ? Number(params.id) : null));
    const { form, handleSubmit, isEditing, isLoading } = useBudgetForm({ editingId });

    if (isLoading) {
        return <LoadingScreen />;
    }

    const actions = { handleSubmit, isEditing, isLoading };

    return (
        <BudgetFormActionsContext.Provider value={actions}>
            <FormProvider {...form}>
                <Stack screenOptions={DEFAULT_STACK_OPTIONS} screenLayout={ScreenLayout} />
            </FormProvider>
        </BudgetFormActionsContext.Provider>
    );
}
