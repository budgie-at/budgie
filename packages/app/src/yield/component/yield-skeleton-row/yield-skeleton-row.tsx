import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useSkeletonPulseStyle } from '../../../@generic/hook/use-skeleton-pulse-style/use-skeleton-pulse-style.hook';
import { TransactionRowSurface } from '../../../transaction/components/transaction-row-surface/transaction-row-surface';
import { getYieldRowBorderClassName } from '../../utils/get-yield-row-border-class-name.util';

import type { TransactionListRowPositionEnum } from '../../../transaction/enum/transaction-list-row-position.enum';

interface Props {
    readonly rowPosition: TransactionListRowPositionEnum;
}

const SEPARATOR_INSET = 64;

export const YieldSkeletonRow = ({ rowPosition }: Props) => {
    const pulseStyle = useSkeletonPulseStyle();

    return (
        <TransactionRowSurface position={rowPosition} separatorInset={SEPARATOR_INSET} className={getYieldRowBorderClassName(rowPosition)}>
            <Animated.View
                style={pulseStyle}
                className="min-h-[56px] flex-row items-center gap-x-xl px-3xl py-lg"
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
