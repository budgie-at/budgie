import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useSkeletonPulseStyle } from '../../../@generic/hook/use-skeleton-pulse-style/use-skeleton-pulse-style.hook';
import { TransactionListRowPositionEnum } from '../../../transaction/enum/transaction-list-row-position.enum';
import { YIELD_BREAKDOWN_ROW_MIN_HEIGHT } from '../../constant/yield-breakdown-row-min-height.constant';
import { YieldSkeletonRow } from '../yield-skeleton-row/yield-skeleton-row';

const BUSY_STATE = { busy: true };

export const YieldBreakdownSkeleton = () => {
    const pulseStyle = useSkeletonPulseStyle();

    return (
        <View className="gap-y-[8px]" pointerEvents="none" accessibilityState={BUSY_STATE} importantForAccessibility="no-hide-descendants">
            <Animated.View style={pulseStyle} className="h-[22px] justify-center px-3xl">
                <View className="h-[14px] w-[72px] rounded-full bg-secondary-corner" />
            </Animated.View>
            <View className="rounded-3xl dark:border-hairline dark:border-surface-separator">
                <YieldSkeletonRow rowPosition={TransactionListRowPositionEnum.FIRST} minHeight={YIELD_BREAKDOWN_ROW_MIN_HEIGHT} />
                <YieldSkeletonRow rowPosition={TransactionListRowPositionEnum.LAST} minHeight={YIELD_BREAKDOWN_ROW_MIN_HEIGHT} />
            </View>
        </View>
    );
};
