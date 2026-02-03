import { RepeatedTransactionPatternInterface } from '@budgie/contracts';
import { Text, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';

interface Props {
    readonly pattern: RepeatedTransactionPatternInterface;
    readonly index: number;
    readonly animationDuration: number;
    readonly staggerDelay: number;
    readonly onSelect: (pattern: RepeatedTransactionPatternInterface) => void;
}

const PILL_ICON_SIZE = 24;
const PILL_ICON_INNER_SIZE = 12;
const PILL_ICON_RADIUS = 12;

export const RepeatedTransactionSuggestionPillItem = (props: Props) => {
    const { pattern, index, animationDuration, staggerDelay, onSelect } = props;

    const handlePress = () => void onSelect(pattern);

    return (
        <Animated.View
            entering={FadeIn.duration(animationDuration).delay(index * staggerDelay)}
            layout={LinearTransition.duration(animationDuration)}
        >
            <HapticPressable
                className="flex-row items-center gap-sm px-md py-xs bg-default-background border border-default-corner rounded-full max-w-48"
                onPress={handlePress}
            >
                <CircleIcon
                    icon={pattern.categoryIcon}
                    size={PILL_ICON_SIZE}
                    iconSize={PILL_ICON_INNER_SIZE}
                    radius={PILL_ICON_RADIUS}
                    variant="secondary"
                />
                <Text className="text-sm text-default-foreground shrink" numberOfLines={1}>
                    {pattern.title}
                </Text>
                <View className="bg-secondary-background rounded-full px-xs py-xxs">
                    <Text className="text-xs text-secondary-foreground" numberOfLines={1}>
                        {pattern.categoryTitle}
                    </Text>
                </View>
            </HapticPressable>
        </Animated.View>
    );
};
