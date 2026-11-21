import { use } from 'react';
import { View } from 'react-native';

import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldChartModeEnum } from '../../enum/yield-chart-mode.enum';
import { YieldLegendLineSwatch } from '../yield-legend-line-swatch/yield-legend-line-swatch';

const DOT_DASH = '1 3';
const SHORT_LENGTH = 12;

export const YieldLegendInProgressSwatch = () => {
    const { mode } = use(YieldScreenContext);

    if (mode === YieldChartModeEnum.RUNNING_TOTAL) {
        return <YieldLegendLineSwatch strokeClassName="accent-positive-action" strokeWidth={2} dash={DOT_DASH} length={SHORT_LENGTH} />;
    }

    return (
        <View importantForAccessibility="no-hide-descendants" className="w-[12px] items-center">
            <View className="size-[10px] rounded-[2px] border-[1px] border-secondary-foreground/70 bg-secondary-foreground/30" />
        </View>
    );
};
