import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';
import Svg from 'react-native-svg';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { SectionHeader } from '../../../@generic/component/section-header/section-header';
import { StyledLine } from '../../../@generic/component/styled-line/styled-line';
import { StyledSvgText } from '../../../@generic/component/styled-svg-text/styled-svg-text';
import { useI18nContext } from '../../../i18n/context/i18n.context';
import {
    RUNWAY_HISTORY_BAR_AREA_HEIGHT,
    RUNWAY_HISTORY_BAR_GAP,
    RUNWAY_HISTORY_CHART_WIDTH,
    RUNWAY_HISTORY_PLOT_TOP
} from '../../constant/runway-history.constant';
import { RunwayHistoryBars } from '../runway-history-bars/runway-history-bars';
import { RunwayHistoryLegend } from '../runway-history-legend/runway-history-legend';
import { RunwayHistoryMedianLine } from '../runway-history-median-line/runway-history-median-line';
import { RunwayHistorySpikeNote } from '../runway-history-spike-note/runway-history-spike-note';

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
    const { t } = useLingui();
    const { intl } = useI18nContext();

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
            labelFillClassName: isSpike ? 'accent-warning-foreground' : 'accent-secondary-foreground',
            labelWeight: isSpike ? '600' : '400'
        };
    });
    const spikeExpense = isDefined(peakRow) ? peakRow.expense : 0;
    const spikeLabel = months.find(month => month.isSpike)?.label ?? '';

    return (
        <View className="gap-y-lg">
            <SectionHeader label={t`Monthly history`} />

            <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${RUNWAY_HISTORY_CHART_WIDTH} ${CHART_HEIGHT}`}>
                <StyledLine x1={0} y1={BASELINE_Y} x2={RUNWAY_HISTORY_CHART_WIDTH} y2={BASELINE_Y} strokeClassName="accent-corner" />

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
                        <StyledSvgText
                            key={month.key}
                            x={month.centerX}
                            y={MONTH_LABEL_Y}
                            fillClassName={month.labelFillClassName}
                            fontSize={MONTH_LABEL_FONT_SIZE}
                            fontWeight={month.labelWeight}
                            textAnchor="middle"
                        >
                            {month.label}
                        </StyledSvgText>
                    ))}
            </Svg>

            <RunwayHistoryLegend hasSpike={hasSpike} typicalAmount={burn} />

            {hasSpike ? <RunwayHistorySpikeNote spikeLabel={spikeLabel} expense={spikeExpense} /> : null}
        </View>
    );
};
