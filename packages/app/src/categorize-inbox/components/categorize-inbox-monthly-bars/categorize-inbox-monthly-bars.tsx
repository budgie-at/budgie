import { View } from 'react-native';

import { CATEGORIZE_INBOX_BAR_STRIP_HEIGHT } from '../../constant/categorize-inbox-bar-motion.constant';
import { CategorizeInboxMonthlyBar } from '../categorize-inbox-monthly-bar/categorize-inbox-monthly-bar';

import type { CategorizeInboxMonthlyBucketInterface } from '../../interface/categorize-inbox-monthly-bucket.interface';

interface Props {
    readonly buckets: readonly CategorizeInboxMonthlyBucketInterface[];
    readonly barClassName: string;
}

export const CategorizeInboxMonthlyBars = ({ buckets, barClassName }: Props) => {
    const maxCount = Math.max(1, ...buckets.map(bucket => bucket.count));
    const stripStyle = { height: CATEGORIZE_INBOX_BAR_STRIP_HEIGHT };

    return (
        <View
            className="flex-row items-end gap-x-[3px]"
            style={stripStyle}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            {buckets.map((bucket, index) => (
                <CategorizeInboxMonthlyBar
                    key={bucket.month.getTime()}
                    count={bucket.count}
                    maxCount={maxCount}
                    index={index}
                    className={barClassName}
                />
            ))}
        </View>
    );
};
