import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useSkeletonPulseStyle } from '../../../@generic/hook/use-skeleton-pulse-style/use-skeleton-pulse-style.hook';
import { TransactionRowSurface } from '../../../transaction/components/transaction-row-surface/transaction-row-surface';
import { YIELD_ROW_SEPARATOR_INSET } from '../../constant/yield-row-separator-inset.constant';
import { getYieldRowBorderClassName } from '../../utils/get-yield-row-border-class-name.util';

import type { TransactionListRowPositionEnum } from '../../../transaction/enum/transaction-list-row-position.enum';

interface Props {
    readonly rowPosition: TransactionListRowPositionEnum;
    readonly minHeight?: number;
}

const DEFAULT_MIN_HEIGHT = 56;

export const YieldSkeletonRow = ({ rowPosition, minHeight = DEFAULT_MIN_HEIGHT }: Props) => {
    const pulseStyle = useSkeletonPulseStyle();
    const rowStyle = [pulseStyle, { minHeight }];

    return (
        <TransactionRowSurface
            position={rowPosition}
            separatorInset={YIELD_ROW_SEPARATOR_INSET}
            className={getYieldRowBorderClassName(rowPosition)}
        >
            <Animated.View
                style={rowStyle}
                className="flex-row items-center gap-x-xl px-3xl py-lg"
                pointerEvents="none"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
            >
                <View className="size-[36px] rounded-full bg-secondary-corner" />
                <View className="flex-1 gap-y-sm">
                    <View className="h-[14px] w-7/12 rounded-full bg-secondary-corner" />
                    <View className="h-[12px] w-4/12 rounded-full bg-secondary-corner" />
                </View>
                <View className="h-[14px] w-[56px] rounded-full bg-secondary-corner" />
            </Animated.View>
        </TransactionRowSurface>
    );
};
