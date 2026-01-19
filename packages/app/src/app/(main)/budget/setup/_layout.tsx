import { Stack } from 'expo-router';

import { ScreenLayout } from '../../../../@generic/component/screen-layout/screen-layout';
import { DEFAULT_STACK_OPTIONS } from '../../../../@generic/constant/default-stack-options.constant';
import { BudgetSetupProvider } from '../../../../budget/context/budget-setup.context';

export default function BudgetSetupLayout() {
    return (
        <BudgetSetupProvider>
            <Stack screenOptions={DEFAULT_STACK_OPTIONS} screenLayout={ScreenLayout} />
        </BudgetSetupProvider>
    );
}
