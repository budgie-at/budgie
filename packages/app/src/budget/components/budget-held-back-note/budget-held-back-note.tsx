import { convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';

import type { BudgetProjectionScopeInterface } from '@budgie/budget';

interface Props {
    readonly scope: Pick<BudgetProjectionScopeInterface, 'reserved' | 'upcoming'>;
    readonly currencySymbol: string;
}

export const BudgetHeldBackNote = ({ scope, currencySymbol }: Props) => {
    const { t } = useLingui();
    const formatProtectedAmount = useProtectedAmountLabel();
    const reservedAmount = formatProtectedAmount(convertFromMicroUnits(scope.reserved), currencySymbol);
    const upcomingAmount = formatProtectedAmount(convertFromMicroUnits(scope.upcoming), currencySymbol);
    const hasReserved = isPositiveNumber(scope.reserved);
    const hasUpcoming = isPositiveNumber(scope.upcoming);

    if (!hasReserved && !hasUpcoming) {
        return null;
    }

    const upcomingLabel = hasUpcoming ? t`After ${upcomingAmount} for upcoming bills` : null;
    const reservedLabel = hasReserved ? t`After ${reservedAmount} set aside` : upcomingLabel;
    const label = hasReserved && hasUpcoming ? t`After ${reservedAmount} set aside and ${upcomingAmount} for bills` : reservedLabel;

    return <Text className="text-xs text-secondary-foreground">{label}</Text>;
};
