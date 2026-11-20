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
        <View
            importantForAccessibility="no-hide-descendants"
            className="h-[14px] w-[14px] rounded-[3px] border border-dashed border-primary bg-primary/40"
        />
    );
};
