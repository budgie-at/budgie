import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';
import Svg, { Line, Text as SvgText } from 'react-native-svg';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useI18nContext } from '../../../i18n/context/i18n.context';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useThemeContext } from '../../../theme/context/theme.context';
import { RUNWAY_CHART_COLORS } from '../../constant/runway-chart-colors.constant';
import {
    RUNWAY_HISTORY_BAR_AREA_HEIGHT,
    RUNWAY_HISTORY_BAR_GAP,
    RUNWAY_HISTORY_CHART_WIDTH,
    RUNWAY_HISTORY_PLOT_TOP
} from '../../constant/runway-history.constant';
import { RunwayHistoryBars } from '../runway-history-bars/runway-history-bars';
import { RunwayHistoryLegend } from '../runway-history-legend/runway-history-legend';
import { RunwayHistoryMedianLine } from '../runway-history-median-line/runway-history-median-line';

import type { RunwaySeriesRowInterface } from '@budgie/contracts';

interface Props {
    readonly series: readonly RunwaySeriesRowInterface[];
    readonly burn: number;
}

const CHART_HEIGHT = 108;
const BASELINE_Y = RUNWAY_HISTORY_PLOT_TOP + RUNWAY_HISTORY_BAR_AREA_HEIGHT;
const MONTH_LABEL_Y = CHART_HEIGHT - 4;
const MONTH_LABEL_FONT_SIZE = 8;
const MAX_MONTH_LABELS = 6;
const MAX_BAR_WIDTH = 16;
const MIN_BAR_WIDTH = 3;
const SLOT_GUTTER_RATIO = 0.3;
const SPIKE_MULTIPLIER = 1.5;

export const RunwayHistoryChart = ({ series, burn }: Props) => {
    const { intl } = useI18nContext();
    const { defaultInstrument } = useSettingsContext();
    const formatDigits = useFormatDigits(0);
    const colors = RUNWAY_CHART_COLORS[useThemeContext().colorScheme];

    const peakRow = series.reduce<RunwaySeriesRowInterface | null>(
        (peak, row) => (isDefined(peak) && peak.expense >= row.expense ? peak : row),
        null
    );
    const maxValue = series.reduce((maximum, row) => Math.max(maximum, row.expense, row.income), 0);
    const hasSpike = isDefined(peakRow) && isPositiveNumber(burn) && peakRow.expense > SPIKE_MULTIPLIER * burn;
    const slotWidth = RUNWAY_HISTORY_CHART_WIDTH / Math.max(series.length, 1);
    const barWidth = Math.min(MAX_BAR_WIDTH, Math.max((slotWidth * (1 - SLOT_GUTTER_RATIO) - RUNWAY_HISTORY_BAR_GAP) / 2, MIN_BAR_WIDTH));
    const labelStep = Math.ceil(series.length / MAX_MONTH_LABELS);
    const months = series.map((row, index) => {
        const [yearText, monthText] = row.month.split('-');
        const isSpike = hasSpike && isDefined(peakRow) && row.month === peakRow.month;

        return {
            key: row.month,
            label: intl.formatDate(new Date(Number(yearText), Number(monthText) - 1, 1), { month: 'short' }),
            centerX: slotWidth * (index + 0.5),
            expense: row.expense,
            income: row.income,
            isSpike,
            hasLabel: (series.length - 1 - index) % labelStep === 0,
            labelFill: isSpike ? colors.spike : colors.label,
            labelWeight: isSpike ? '600' : '400'
        };
    });
    const spikeAmount = isDefined(peakRow) ? formatDigits(convertFromMicroUnits(peakRow.expense), defaultInstrument.symbol) : '';
    const spikeLabel = months.find(month => month.isSpike)?.label ?? '';

    return (
        <Card className="gap-y-xl">
            <Text className="text-xxs uppercase tracking-wider text-secondary-foreground">
                <Trans>Monthly history</Trans>
            </Text>

            <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${RUNWAY_HISTORY_CHART_WIDTH} ${CHART_HEIGHT}`}>
                <Line x1={0} y1={BASELINE_Y} x2={RUNWAY_HISTORY_CHART_WIDTH} y2={BASELINE_Y} stroke={colors.zero} />

                {months.map(month => (
                    <RunwayHistoryBars
                        key={month.key}
                        centerX={month.centerX}
                        barWidth={barWidth}
                        baselineY={BASELINE_Y}
                        expense={month.expense}
                        income={month.income}
                        maxValue={maxValue}
                        isSpike={month.isSpike}
                    />
                ))}

                <RunwayHistoryMedianLine value={burn} maxValue={maxValue} />

                {months
                    .filter(month => month.hasLabel)
                    .map(month => (
                        <SvgText
                            key={month.key}
                            x={month.centerX}
                            y={MONTH_LABEL_Y}
                            fill={month.labelFill}
                            fontSize={MONTH_LABEL_FONT_SIZE}
                            fontWeight={month.labelWeight}
                            textAnchor="middle"
                        >
                            {month.label}
                        </SvgText>
                    ))}
            </Svg>

            <RunwayHistoryLegend hasSpike={hasSpike} typicalAmount={burn} />

            {hasSpike ? (
                <Text className="text-xs tabular-nums text-secondary-foreground">
                    <Trans>
                        {spikeLabel} had a one-off {spikeAmount}. The estimate uses a typical month instead.
                    </Trans>
                </Text>
            ) : null}
        </Card>
    );
};
