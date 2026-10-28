import { BudgetPaceStatusEnum } from '@budgie/budget';
import { convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { BudgetSelector } from '../../budget.selector';

import type { BudgetProjectionScopeInterface } from '@budgie/budget';

interface Props {
    readonly scope: BudgetProjectionScopeInterface;
    readonly currencySymbol: string;
    readonly periodEnd: Date;
}

export const BudgetVerdictOutlook = ({ scope, currencySymbol, periodEnd }: Props) => {
    const { t } = useLingui();
    const formatProtectedAmount = useProtectedAmountLabel();
    const { formatMonthAndDay } = useFormatDate();
    const isOver = scope.status === BudgetPaceStatusEnum.OVER;
    const periodEndLabel = formatMonthAndDay(periodEnd);
    const freeAmount = formatProtectedAmount(convertFromMicroUnits(Math.max(scope.free, 0)), currencySymbol);
    const projectedOverAmount = formatProtectedAmount(convertFromMicroUnits(scope.projectedOver ?? 0), currencySymbol);
    const outlookLabel = isOver
        ? t`Projected ${projectedOverAmount} over by ${periodEndLabel}`
        : t`${freeAmount} free until ${periodEndLabel}`;

    if (isOver && !isPositiveNumber(scope.projectedOver ?? 0)) {
        return null;
    }

    return (
        <Text testID={BudgetSelector.DetailsRemainingLabel} className="text-sm text-secondary-foreground">
            {outlookLabel}
        </Text>
    );
};
