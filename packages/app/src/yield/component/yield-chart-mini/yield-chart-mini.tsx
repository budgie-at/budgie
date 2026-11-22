import { YieldRangeEnum } from '@budgie/market';
import { parseISO } from 'date-fns/parseISO';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { YieldChartMiniBar } from '../yield-chart-mini-bar/yield-chart-mini-bar';

import type { YieldBucketInterface } from '@budgie/market';

interface Props {
    readonly buckets: readonly YieldBucketInterface[];
    readonly focusDay: string | null;
    readonly range: YieldRangeEnum;
}

export const YieldChartMini = ({ buckets, focusDay, range }: Props) => {
    const { formatMonthAndDay, formatMonthAndYear } = useFormatDate();
    const max = Math.max(0, ...buckets.map(bucket => bucket.total));
    const formatters: Record<YieldRangeEnum, (date: Date) => string> = {
        [YieldRangeEnum.MONTH]: formatMonthAndDay,
        [YieldRangeEnum.QUARTER]: formatMonthAndDay,
        [YieldRangeEnum.YEAR]: formatMonthAndYear,
        [YieldRangeEnum.ALL]: formatMonthAndYear
    };
    const firstBucket = buckets.at(0);
    const lastBucket = buckets.at(-1);
    const formatLabel = formatters[range];

    return (
        <View className="gap-y-xs" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <View className="h-[32px] flex-row items-end gap-x-[2px]">
                {buckets.map(bucket => (
                    <YieldChartMiniBar key={bucket.start} bucket={bucket} max={max} focusDay={focusDay} />
                ))}
            </View>
            {isDefined(firstBucket) && isDefined(lastBucket) ? (
                <View className="flex-row justify-between">
                    <Text className="text-[11px] tabular-nums text-secondary-foreground" maxFontSizeMultiplier={1.5}>
                        {formatLabel(parseISO(firstBucket.start))}
                    </Text>
                    <Text className="text-[11px] tabular-nums text-secondary-foreground" maxFontSizeMultiplier={1.5}>
                        {formatLabel(parseISO(lastBucket.start))}
                    </Text>
                </View>
            ) : null}
        </View>
    );
};
