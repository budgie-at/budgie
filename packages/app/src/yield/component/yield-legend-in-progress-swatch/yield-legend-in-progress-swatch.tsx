import { use } from 'react';
import { View } from 'react-native';

import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldChartModeEnum } from '../../enum/yield-chart-mode.enum';
import { YieldLegendLineSwatch } from '../yield-legend-line-swatch/yield-legend-line-swatch';

const DOT_DASH = '1 3';

export const YieldLegendInProgressSwatch = () => {
    const { mode } = use(YieldScreenContext);

    if (mode === YieldChartModeEnum.RUNNING_TOTAL) {
        return <YieldLegendLineSwatch strokeClassName="accent-positive-action" strokeWidth={2} dash={DOT_DASH} />;
    }

    return (
        <View importantForAccessibility="no-hide-descendants" className="w-[12px] items-center">
            <View className="size-[11px] rounded-[2px] border-[1.5px] border-dashed border-secondary-foreground bg-secondary-foreground/20" />
        </View>
    );
};
