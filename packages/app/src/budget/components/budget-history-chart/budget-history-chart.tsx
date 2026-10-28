import { router } from 'expo-router';
import { View } from 'react-native';
import Svg from 'react-native-svg';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { StyledLine } from '../../../@generic/component/styled-line/styled-line';
import { StyledSvgText } from '../../../@generic/component/styled-svg-text/styled-svg-text';
import {
    BUDGET_HISTORY_BASELINE_Y,
    BUDGET_HISTORY_CHART_HEIGHT,
    BUDGET_HISTORY_CHART_WIDTH
} from '../../constant/budget-history-chart.constant';
import { BudgetHistoryBarShape } from '../budget-history-bar-shape/budget-history-bar-shape';

import type { BudgetHistoryBarInterface } from '../../interface/budget-history-bar.interface';

interface Props {
    readonly bars: readonly BudgetHistoryBarInterface[];
}

const MAX_BAR_WIDTH = 24;
const SLOT_BAR_RATIO = 0.5;
const LABEL_Y = BUDGET_HISTORY_CHART_HEIGHT - 4;
const LABEL_FONT_SIZE = 9;
const CHART_ASPECT_STYLE = { aspectRatio: BUDGET_HISTORY_CHART_WIDTH / BUDGET_HISTORY_CHART_HEIGHT };

export const BudgetHistoryChart = ({ bars }: Props) => {
    const scaleMax = Math.max(1, ...bars.map(bar => Math.max(bar.spent, bar.limit)));
    const slotWidth = BUDGET_HISTORY_CHART_WIDTH / bars.length;
    const barWidth = Math.min(MAX_BAR_WIDTH, slotWidth * SLOT_BAR_RATIO);

    const handleBarPress = (snapshotId: number | null) => () => {
        if (isDefined(snapshotId)) {
            router.push({ pathname: '/budget-period-summary', params: { snapshotId: String(snapshotId) } });
        }
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
                        centerX={slotWidth * (index + 0.5)}
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
                        x={slotWidth * (index + 0.5)}
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
                    <HapticPressable
                        key={bar.key}
                        accessibilityLabel={bar.label}
                        accessibilityRole="button"
                        className="flex-1"
                        disabled={!isDefined(bar.snapshotId)}
                        onPress={handleBarPress(bar.snapshotId)}
                    />
                ))}
            </View>
        </View>
    );
};
