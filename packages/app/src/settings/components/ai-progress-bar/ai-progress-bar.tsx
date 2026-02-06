import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface Props {
    readonly progress: number;
    readonly phaseLabel: string;
    readonly isActive: boolean;
}

export const AiProgressBar = ({ progress, phaseLabel, isActive }: Props) => {
    const widthStyle = useAnimatedStyle(() => ({
        width: withTiming(`${progress}%`, { duration: 300 })
    }));

    if (!isActive) {
        return null;
    }

    return (
        <View className="gap-y-sm">
            <View className="flex-row items-center justify-between">
                <Text className="text-xs text-secondary-foreground">{phaseLabel}</Text>
                <Text className="text-xs text-secondary-foreground">{progress}%</Text>
            </View>
            <View className="rounded-5xl bg-secondary-corner h-2">
                <Animated.View style={widthStyle} className="h-2 rounded-5xl bg-secondary-foreground" />
            </View>
        </View>
    );
};
