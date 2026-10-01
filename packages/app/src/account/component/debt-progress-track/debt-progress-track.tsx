import { cn } from 'cn';
import { View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { useDebtProgressFill } from '../../hooks/use-debt-progress-fill.hook';

interface Props {
    readonly percentage: number;
    readonly className?: string;
}

export const DebtProgressTrack = ({ percentage, className }: Props) => {
    const width = useDebtProgressFill(percentage);

    const fillStyle = useAnimatedStyle(() => ({ width: `${width.get()}%` }));

    return (
        <View className={cn('overflow-hidden rounded-full bg-secondary-background', className)}>
            <Animated.View className="h-full rounded-full bg-primary" style={fillStyle} />
        </View>
    );
};
