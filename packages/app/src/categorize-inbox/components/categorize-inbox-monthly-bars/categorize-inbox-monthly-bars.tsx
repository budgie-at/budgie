import { View } from 'react-native';

import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { CategorizeInboxMonthlyBar } from '../categorize-inbox-monthly-bar/categorize-inbox-monthly-bar';

import type { CategorizeInboxMonthlyBucketInterface } from '../../interface/categorize-inbox-monthly-bucket.interface';

interface Props {
    readonly buckets: readonly CategorizeInboxMonthlyBucketInterface[];
}

export const CategorizeInboxMonthlyBars = ({ buckets }: Props) => {
    const { formatShortMonth } = useFormatDate();

    const maxCount = Math.max(1, ...buckets.map(bucket => bucket.count));
    const bars = buckets.map((bucket, index) => ({
        ...bucket,
        className: index === buckets.length - 1 ? 'bg-primary' : 'bg-secondary-foreground/60'
    }));

    return (
        <View className="flex-row items-end gap-x-xs" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {bars.map((bar, index) => (
                <CategorizeInboxMonthlyBar
                    key={bar.month.getTime()}
                    count={bar.count}
                    maxCount={maxCount}
                    index={index}
                    monthLabel={formatShortMonth(bar.month)}
                    className={bar.className}
                />
            ))}
        </View>
    );
};
