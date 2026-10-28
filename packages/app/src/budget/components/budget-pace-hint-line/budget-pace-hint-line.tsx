import { convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { BudgetSelector } from '../../budget.selector';

import type { BudgetProjectionScopeInterface } from '@budgie/budget';

interface Props {
    readonly title: string;
    readonly scope: BudgetProjectionScopeInterface;
    readonly currencySymbol: string;
    readonly onPress: () => void;
}

export const BudgetPaceHintLine = ({ title, scope, currencySymbol, onPress }: Props) => {
    const { t } = useLingui();
    const formatProtectedAmount = useProtectedAmountLabel();
    const perDayAmount = formatProtectedAmount(convertFromMicroUnits(scope.safePerDay), currencySymbol);
    const headline = t`${title} is ahead of pace`;
    const advice = t`keep under ${perDayAmount}/day`;

    return (
        <HapticPressable
            accessibilityLabel={`${headline} · ${advice}`}
            accessibilityRole="button"
            testID={BudgetSelector.DetailsPaceBanner}
            onPress={onPress}
        >
            <Text className="text-xs text-secondary-foreground">
                {headline} · <Text className="text-warning-foreground">{advice}</Text>
            </Text>
        </HapticPressable>
    );
};
