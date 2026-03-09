import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

interface Props {
    readonly day: number;
    readonly highlightDelay: number | undefined;
    readonly animationDuration: number;
}

export const RecurringCalendarEmptyStateDay = ({ day, highlightDelay, animationDuration }: Props) => (
    <View className="w-10 h-10 items-center justify-center">
        {isDefined(highlightDelay) ? (
            <Animated.View
                entering={FadeIn.delay(highlightDelay).duration(animationDuration)}
                className="w-10 h-10 rounded-full bg-warning-background items-center justify-center"
            >
                <Text className="text-xs text-warning-foreground font-semibold">{day}</Text>
                <View className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-warning-foreground" />
            </Animated.View>
        ) : (
            <Text className="text-xs text-secondary-foreground/40">{day}</Text>
        )}
    </View>
);
