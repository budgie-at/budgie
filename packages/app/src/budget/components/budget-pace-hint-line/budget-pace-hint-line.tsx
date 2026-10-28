import { convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

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
    const label = t`${title} is running fast — keep it under ${perDayAmount}/day.`;

    return (
        <Text
            accessibilityLabel={label}
            accessibilityRole="button"
            className="text-warning-foreground"
            testID={BudgetSelector.DetailsPaceBanner}
            onPress={onPress}
        >
            {label}
        </Text>
    );
};
