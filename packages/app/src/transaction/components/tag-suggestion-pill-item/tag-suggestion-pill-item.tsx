import { TagEntityInterface } from '@budgie/contracts';
import { Text } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';

interface Props {
    readonly tag: TagEntityInterface;
    readonly index: number;
    readonly animationDuration: number;
    readonly staggerDelay: number;
    readonly onSelect: (tagId: number) => void;
}

export const TagSuggestionPillItem = (props: Props) => {
    const { tag, index, animationDuration, staggerDelay, onSelect } = props;

    const handlePress = () => void onSelect(tag.id);

    return (
        <Animated.View
            entering={FadeIn.duration(animationDuration).delay(index * staggerDelay)}
            layout={LinearTransition.duration(animationDuration)}
        >
            <HapticPressable
                className="flex-row items-center gap-sm px-md py-xs bg-default-background border border-default-corner rounded-full max-w-40"
                onPress={handlePress}
            >
                <Text className="text-sm text-default-foreground px-xs shrink" numberOfLines={1}>
                    {tag.title}
                </Text>
            </HapticPressable>
        </Animated.View>
    );
};
