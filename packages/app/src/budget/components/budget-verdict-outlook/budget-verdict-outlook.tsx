import { BudgetPaceStatusEnum } from '@budgie/budget';
import { convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';

import type { BudgetProjectionScopeInterface } from '@budgie/budget';
import type { ReactNode } from 'react';

interface Props {
    readonly scope: BudgetProjectionScopeInterface;
    readonly currencySymbol: string;
    readonly periodEnd: Date;
    readonly children: ReactNode;
}

export const BudgetVerdictOutlook = ({ scope, currencySymbol, periodEnd, children }: Props) => {
    const { t } = useLingui();
    const formatProtectedAmount = useProtectedAmountLabel();
    const { formatMonthAndDay } = useFormatDate();
    const isOver = scope.status === BudgetPaceStatusEnum.OVER;
    const periodEndLabel = formatMonthAndDay(periodEnd);
    const freeAmount = formatProtectedAmount(convertFromMicroUnits(Math.max(scope.free, 0)), currencySymbol);
    const projectedOverAmount = formatProtectedAmount(convertFromMicroUnits(scope.projectedOver ?? 0), currencySymbol);
    const overLabel = t`Projected ${projectedOverAmount} over by ${periodEndLabel}.`;
    const freeLabel = t`${freeAmount} free until ${periodEndLabel}.`;
    const hasOutlook = !isOver || isPositiveNumber(scope.projectedOver ?? 0);
    const outlookLabel = isOver ? overLabel : freeLabel;
    const visibleLabel = hasOutlook ? outlookLabel : '';

    return (
        <Text className="text-sm text-secondary-foreground">
            {visibleLabel} {children}
        </Text>
    );
};
