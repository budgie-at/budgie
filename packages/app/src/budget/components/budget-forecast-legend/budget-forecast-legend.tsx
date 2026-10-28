import { convertFromMicroUnits } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';

import type { BudgetProjectionInterface } from '@budgie/budget';

interface Props {
    readonly projection: BudgetProjectionInterface;
    readonly currencySymbol: string;
}

const DASH_SEGMENTS = [0, 1, 2] as const;

export const BudgetForecastLegend = ({ projection, currencySymbol }: Props) => {
    const { t } = useLingui();
    const { formatMonthAndDay } = useFormatDate();
    const formatProtectedAmount = useProtectedAmountLabel();
    const { overall, days } = projection;
    const projectedAmount = formatProtectedAmount(convertFromMicroUnits(overall.projectedEnd ?? overall.spent), currencySymbol);
    const periodEndLabel = formatMonthAndDay(days[days.length - 1].date);

    return (
        <View className="flex-row flex-wrap items-center gap-x-lg gap-y-xs">
            <View className="flex-row items-center gap-x-sm">
                <View className="h-0.5 w-4 rounded-full bg-primary" />
                <Text className="text-xxs text-secondary-foreground">
                    <Trans>Spent so far</Trans>
                </Text>
            </View>

            <View className="flex-row items-center gap-x-sm">
                <View className="flex-row gap-x-xxs">
                    {DASH_SEGMENTS.map(segment => (
                        <View key={segment} className="h-0.5 w-1 rounded-full bg-primary opacity-50" />
                    ))}
                </View>
                <Text className="text-xxs text-secondary-foreground">{t`Projected · ${projectedAmount} by ${periodEndLabel}`}</Text>
            </View>
        </View>
    );
};
