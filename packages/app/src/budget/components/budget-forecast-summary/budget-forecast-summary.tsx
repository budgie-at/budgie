import { convertFromMicroUnits } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';

import type { BudgetProjectionInterface } from '@budgie/budget';

interface Props {
    readonly projection: BudgetProjectionInterface;
    readonly currencySymbol: string;
}

export const BudgetForecastSummary = ({ projection, currencySymbol }: Props) => {
    const { formatMonthAndDay } = useFormatDate();
    const formatProtectedAmount = useProtectedAmountLabel();
    const { overall, days } = projection;
    const projectedEnd = overall.projectedEnd ?? overall.spent;
    const projectedAmount = formatProtectedAmount(convertFromMicroUnits(projectedEnd), currencySymbol);
    const differenceAmount = formatProtectedAmount(convertFromMicroUnits(Math.abs(overall.limit - projectedEnd)), currencySymbol);
    const periodEndLabel = formatMonthAndDay(days[days.length - 1].date);
    const isOver = projectedEnd > overall.limit;

    return (
        <Text className="text-xs text-secondary-foreground">
            {isOver ? (
                <Trans>
                    Projected <Text className="font-semibold text-primary">{projectedAmount}</Text> by {periodEndLabel} ·{' '}
                    <Text className="text-destructive-foreground">{differenceAmount} over</Text>
                </Trans>
            ) : (
                <Trans>
                    Projected <Text className="font-semibold text-primary">{projectedAmount}</Text> by {periodEndLabel} · {differenceAmount}{' '}
                    under
                </Trans>
            )}
        </Text>
    );
};
