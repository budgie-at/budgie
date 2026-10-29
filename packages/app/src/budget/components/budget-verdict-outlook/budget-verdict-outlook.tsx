import { BudgetPaceStatusEnum } from '@budgie/budget';
import { convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';

import type { BudgetProjectionScopeInterface } from '@budgie/budget';

interface Props {
    readonly scope: BudgetProjectionScopeInterface;
    readonly currencySymbol: string;
}

export const BudgetVerdictOutlook = ({ scope, currencySymbol }: Props) => {
    const { t } = useLingui();
    const formatProtectedAmount = useProtectedAmountLabel();
    const { projectedEnd } = scope;

    if (scope.status === BudgetPaceStatusEnum.TOO_EARLY || !isDefined(projectedEnd)) {
        return null;
    }

    const differenceAmount = formatProtectedAmount(convertFromMicroUnits(Math.abs(scope.limit - projectedEnd)), currencySymbol);
    const label = projectedEnd > scope.limit ? t`On pace to go ${differenceAmount} over.` : t`On pace to finish ${differenceAmount} under.`;

    return <Text className="text-sm text-secondary-foreground">{label}</Text>;
};
