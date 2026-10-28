import { convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';
import Svg from 'react-native-svg';

import { StyledLine } from '../../../@generic/component/styled-line/styled-line';
import { StyledSvgText } from '../../../@generic/component/styled-svg-text/styled-svg-text';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import {
    BUDGET_HISTORY_BASELINE_Y,
    BUDGET_HISTORY_CHART_HEIGHT,
    BUDGET_HISTORY_CHART_WIDTH
} from '../../constant/budget-history-chart.constant';
import { BudgetHistoryBarButton } from '../budget-history-bar-button/budget-history-bar-button';
import { BudgetHistoryBarShape } from '../budget-history-bar-shape/budget-history-bar-shape';

import type { BudgetHistoryBarInterface } from '../../interface/budget-history-bar.interface';

interface Props {
    readonly bars: readonly BudgetHistoryBarInterface[];
    readonly currencySymbol: string;
}

const MAX_BAR_WIDTH = 24;
const SLOT_BAR_RATIO = 0.5;
const LABEL_Y = BUDGET_HISTORY_CHART_HEIGHT - 4;
const LABEL_FONT_SIZE = 10;
const CHART_ASPECT_STYLE = { aspectRatio: BUDGET_HISTORY_CHART_WIDTH / BUDGET_HISTORY_CHART_HEIGHT };

export const BudgetHistoryChart = ({ bars, currencySymbol }: Props) => {
    const { t } = useLingui();
    const formatProtectedAmount = useProtectedAmountLabel();
    const scaleMax = Math.max(1, ...bars.map(bar => Math.max(bar.spent, bar.limit)));
    const slotWidth = BUDGET_HISTORY_CHART_WIDTH / bars.length;
    const barWidth = Math.min(MAX_BAR_WIDTH, slotWidth * SLOT_BAR_RATIO);
    const centerXs = bars.map((_bar, index) => slotWidth * (index + 0.5));

    const buildBarLabel = (bar: BudgetHistoryBarInterface) => {
        const periodLabel = bar.label;
        const spentAmount = formatProtectedAmount(convertFromMicroUnits(bar.spent), currencySymbol);
        const limitAmount = formatProtectedAmount(convertFromMicroUnits(bar.limit), currencySymbol);

        return t`${periodLabel}, spent ${spentAmount} of ${limitAmount}`;
    };

    return (
        <View className="relative w-full" style={CHART_ASPECT_STYLE}>
            <Svg width="100%" height="100%" viewBox={`0 0 ${BUDGET_HISTORY_CHART_WIDTH} ${BUDGET_HISTORY_CHART_HEIGHT}`}>
                <StyledLine
                    x1={0}
                    y1={BUDGET_HISTORY_BASELINE_Y}
                    x2={BUDGET_HISTORY_CHART_WIDTH}
                    y2={BUDGET_HISTORY_BASELINE_Y}
                    strokeClassName="accent-corner"
                />

                {bars.map((bar, index) => (
                    <BudgetHistoryBarShape
                        key={bar.key}
                        centerX={centerXs[index]}
                        barWidth={barWidth}
                        spent={bar.spent}
                        limit={bar.limit}
                        scaleMax={scaleMax}
                        isCurrent={bar.isCurrent}
                        isEstimated={bar.isEstimated}
                    />
                ))}

                {bars.map((bar, index) => (
                    <StyledSvgText
                        key={bar.key}
                        x={centerXs[index]}
                        y={LABEL_Y}
                        fillClassName="accent-secondary-foreground"
                        fontSize={LABEL_FONT_SIZE}
                        textAnchor="middle"
                    >
                        {bar.label}
                    </StyledSvgText>
                ))}
            </Svg>

            <View className="absolute inset-0 flex-row">
                {bars.map(bar => (
                    <BudgetHistoryBarButton key={bar.key} label={buildBarLabel(bar)} snapshotId={bar.snapshotId} />
                ))}
            </View>
        </View>
    );
};
