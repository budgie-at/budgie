import { View } from 'react-native';

import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { CategorizeInboxMonthlyBar } from '../categorize-inbox-monthly-bar/categorize-inbox-monthly-bar';

import type { CategorizeInboxMonthlyBucketInterface } from '../../interface/categorize-inbox-monthly-bucket.interface';

interface Props {
    readonly buckets: readonly CategorizeInboxMonthlyBucketInterface[];
    readonly barClassName: string;
}

export const CategorizeInboxMonthlyBars = ({ buckets, barClassName }: Props) => {
    const { formatShortMonth } = useFormatDate();

    const maxCount = Math.max(1, ...buckets.map(bucket => bucket.count));

    return (
        <View className="flex-row items-end gap-x-xs" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {buckets.map((bucket, index) => (
                <CategorizeInboxMonthlyBar
                    key={bucket.month.getTime()}
                    count={bucket.count}
                    maxCount={maxCount}
                    index={index}
                    monthLabel={formatShortMonth(bucket.month)}
                    className={barClassName}
                />
            ))}
        </View>
    );
};
