import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useSkeletonPulseStyle } from '../../../@generic/hook/use-skeleton-pulse-style/use-skeleton-pulse-style.hook';

interface Props {
    readonly testID?: string;
}

export const MarketDataSparklineSkeleton = ({ testID }: Props) => {
    const pulseStyle = useSkeletonPulseStyle();

    return (
        <Animated.View
            className="border-secondary-corner bg-secondary-background rounded-5xl border p-lg"
            pointerEvents="none"
            style={pulseStyle}
            testID={testID}
        >
            <View className="h-[112px] justify-end gap-y-md px-md py-md">
                <View className="bg-secondary-corner/50 h-[18px] w-5/12 rounded-full" />
                <View className="bg-secondary-corner/50 h-[28px] w-8/12 rounded-full self-center" />
                <View className="bg-secondary-corner/50 h-[20px] w-6/12 rounded-full self-end" />
            </View>
        </Animated.View>
    );
};
