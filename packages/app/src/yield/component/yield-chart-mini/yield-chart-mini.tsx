import { View } from 'react-native';

import { YieldChartMiniBar } from '../yield-chart-mini-bar/yield-chart-mini-bar';

import type { YieldBucketInterface } from '@budgie/market';

interface Props {
    readonly buckets: readonly YieldBucketInterface[];
    readonly focusDay: string | null;
}

export const YieldChartMini = ({ buckets, focusDay }: Props) => {
    const max = Math.max(0, ...buckets.map(bucket => bucket.total));

    return (
        <View
            className="h-[32px] flex-row items-end gap-x-[2px]"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            {buckets.map(bucket => (
                <YieldChartMiniBar key={bucket.start} bucket={bucket} max={max} focusDay={focusDay} />
            ))}
        </View>
    );
};
