import { Stack } from 'expo-router';

import { ScreenLayout } from '../../../@generic/component/screen-layout/screen-layout';
import { DEFAULT_STACK_OPTIONS } from '../../../@generic/constant/default-stack-options.constant';
import { BudgetIntegrityGuard } from '../../../budget/components/budget-integrity-guard/budget-integrity-guard';

export default function BudgetLayout() {
    return (
        <BudgetIntegrityGuard>
            <Stack screenOptions={DEFAULT_STACK_OPTIONS} screenLayout={ScreenLayout} />
        </BudgetIntegrityGuard>
    );
}
