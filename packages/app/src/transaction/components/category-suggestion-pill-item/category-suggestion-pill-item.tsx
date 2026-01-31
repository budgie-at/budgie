import { CategoryEntityInterface } from '@budgie/contracts';
import { Text } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';

interface Props {
    readonly category: CategoryEntityInterface;
    readonly index: number;
    readonly animationDuration: number;
    readonly staggerDelay: number;
    readonly onSelect: (categoryId: number) => void;
}

const PILL_ICON_SIZE = 24;
const PILL_ICON_INNER_SIZE = 12;
const PILL_ICON_RADIUS = 12;

export const CategorySuggestionPillItem = (props: Props) => {
    const { category, index, animationDuration, staggerDelay, onSelect } = props;

    const handlePress = () => void onSelect(category.id);

    return (
        <Animated.View
            entering={FadeIn.duration(animationDuration).delay(index * staggerDelay)}
            layout={LinearTransition.duration(animationDuration)}
        >
            <HapticPressable
                className="flex-row items-center gap-sm px-md py-xs bg-default-background border border-default-corner rounded-full max-w-40"
                onPress={handlePress}
            >
                <CircleIcon
                    icon={category.icon}
                    size={PILL_ICON_SIZE}
                    iconSize={PILL_ICON_INNER_SIZE}
                    radius={PILL_ICON_RADIUS}
                    variant="secondary"
                />
                <Text className="text-sm text-default-foreground pr-xs shrink" numberOfLines={1}>
                    {category.title}
                </Text>
            </HapticPressable>
        </Animated.View>
    );
};
