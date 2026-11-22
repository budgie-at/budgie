import { use } from 'react';
import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { useCSSVariable } from 'uniwind';

import { isString } from '@rnw-community/shared';

import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldChartModeEnum } from '../../enum/yield-chart-mode.enum';
import { YieldLegendLineSwatch } from '../yield-legend-line-swatch/yield-legend-line-swatch';

const DOT_DASH = '3 3';
const SQUARE_SIZE = 10;
const SQUARE_INSET = 0.6;
const SQUARE_INNER_SIZE = 8.8;
const SQUARE_RADIUS = 2;
const SQUARE_DASH = [2, 1.5];

export const YieldLegendInProgressSwatch = () => {
    const { mode } = use(YieldScreenContext);
    const color = useCSSVariable('--color-secondary-foreground');

    if (mode === YieldChartModeEnum.RUNNING_TOTAL) {
        return <YieldLegendLineSwatch strokeClassName="accent-positive-action" strokeWidth={2} dash={DOT_DASH} />;
    }

    return (
        <View importantForAccessibility="no-hide-descendants" className="w-[12px] items-center">
            {isString(color) ? (
                <Svg width={SQUARE_SIZE} height={SQUARE_SIZE}>
                    <Rect
                        x={SQUARE_INSET}
                        y={SQUARE_INSET}
                        width={SQUARE_INNER_SIZE}
                        height={SQUARE_INNER_SIZE}
                        rx={SQUARE_RADIUS}
                        fill={color}
                        fillOpacity={0.2}
                        stroke={color}
                        strokeWidth={1.25}
                        strokeDasharray={SQUARE_DASH}
                    />
                </Svg>
            ) : null}
        </View>
    );
};
