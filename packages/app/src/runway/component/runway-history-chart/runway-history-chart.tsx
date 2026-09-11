import { Trans } from '@lingui/react/macro';
import { Text, View, ViewStyle } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useI18nContext } from '../../../i18n/context/i18n.context';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { RUNWAY_HISTORY_BAR_AREA_HEIGHT, RUNWAY_HISTORY_SPIKE_MULTIPLIER } from '../../constant/runway-history.constant';
import { RunwayHistoryBars } from '../runway-history-bars/runway-history-bars';

import type { RunwaySeriesRowInterface } from '@budgie/contracts';

interface Props {
    readonly series: readonly RunwaySeriesRowInterface[];
    readonly burn: number;
}

export const RunwayHistoryChart = ({ series, burn }: Props) => {
    const { intl } = useI18nContext();
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);

    const formatMonth = (month: string) => {
        const [yearText, monthText] = month.split('-');

        return intl.formatDate(new Date(Number(yearText), Number(monthText) - 1, 1), { month: 'short' });
    };

    const peakRow = series.reduce<RunwaySeriesRowInterface | null>(
        (peak, row) => (isDefined(peak) && peak.expense >= row.expense ? peak : row),
        null
    );
    const maxValue = series.reduce((maximum, row) => Math.max(maximum, row.expense, row.income), 0);
    const hasSpike = isDefined(peakRow) && isPositiveNumber(burn) && peakRow.expense > RUNWAY_HISTORY_SPIKE_MULTIPLIER * burn;
    const medianOffset = isPositiveNumber(maxValue)
        ? Math.min(Math.max((burn / maxValue) * RUNWAY_HISTORY_BAR_AREA_HEIGHT, 0), RUNWAY_HISTORY_BAR_AREA_HEIGHT)
        : 0;
    const medianStyle: ViewStyle = { bottom: medianOffset };
    const months = series.map(row => ({
        key: row.month,
        label: formatMonth(row.month),
        spend: row.expense,
        income: row.income,
        isSpike: hasSpike && isDefined(peakRow) && row.month === peakRow.month
    }));
    const peakLabel = isDefined(peakRow) ? formatMonth(peakRow.month) : '';
    const peakAmount = isDefined(peakRow) ? formatDigits(convertFromMicroUnits(peakRow.expense), defaultInstrument.symbol) : '';
    const medianLabel = formatDigits(convertFromMicroUnits(burn), defaultInstrument.symbol);

    return (
        <Card className="gap-y-xl">
            <View className="flex-row items-center justify-between">
                <Text className="text-xxs uppercase tracking-wider text-secondary-foreground">
                    <Trans>Monthly history</Trans>
                </Text>
                <Text className="text-xxs text-secondary-foreground">
                    <Trans>median {medianLabel}</Trans>
                </Text>
            </View>

            <View>
                <View className="relative flex-row items-end justify-between">
                    <View className="absolute inset-x-0 border-t border-dashed border-secondary-foreground/40" style={medianStyle} />

                    {months.map(month => (
                        <RunwayHistoryBars
                            key={month.key}
                            spend={month.spend}
                            income={month.income}
                            maxValue={maxValue}
                            isSpike={month.isSpike}
                        />
                    ))}
                </View>

                <View className="mt-xs flex-row justify-between">
                    {months.map(month => (
                        <View key={month.key} className="w-9 items-center">
                            <Text className="text-xxs text-secondary-foreground">{month.label}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {hasSpike && isDefined(peakRow) ? (
                <Text className="text-xs text-secondary-foreground">
                    <Trans>
                        {peakLabel} spiked to {peakAmount} — the median ignores it.
                    </Trans>
                </Text>
            ) : null}
        </Card>
    );
};
