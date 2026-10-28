import { useAtomValue } from '@effect/atom-react/Hooks';
import { Text, View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { decimalPlacesAtom } from '../../../settings/constants/settings-atoms.constant';
import { BudgetSelector } from '../../budget.selector';
import { useBudgetProgressLabels } from '../../hooks/use-budget-progress-labels.hook';

import type { BudgetProjectionScopeInterface } from '@budgie/budget';

interface Props {
    readonly scope: BudgetProjectionScopeInterface;
    readonly currencySymbol: string;
}

export const BudgetVerdictSpent = ({ scope, currencySymbol }: Props) => {
    const labels = useBudgetProgressLabels(scope.spent, scope.limit, currencySymbol, useAtomValue(decimalPlacesAtom));

    return (
        <View className="flex-row items-baseline gap-x-sm">
            <ProtectedText testID={BudgetSelector.DetailsSpentLabel} className="text-sm tabular-nums text-secondary-foreground">
                {labels.amountLabel}
            </ProtectedText>
            <Text className="text-sm tabular-nums text-secondary-foreground">{labels.percentLabel}</Text>
        </View>
    );
};
