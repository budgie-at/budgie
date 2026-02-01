import { UserIconNameEnum } from '@budgie/contracts';
import { Text } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { EmptyFn } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly label: string;
    readonly icon?: UserIconNameEnum;
    readonly index: number;
    readonly animationDuration: number;
    readonly staggerDelay: number;
    readonly onPress: EmptyFn;
    readonly testID?: string;
}

const PILL_ICON_SIZE = 14;

export const SuggestRulePillItem = (props: Props) => {
    const { label, icon = UserIconNameEnum.Sparkles, index, animationDuration, staggerDelay, onPress, testID } = props;

    return (
        <Animated.View
            entering={FadeIn.duration(animationDuration).delay(index * staggerDelay)}
            layout={LinearTransition.duration(animationDuration)}
        >
            <HapticPressable
                className="flex-row items-center gap-sm px-md py-xs bg-default-background border border-default-corner rounded-full"
                onPress={onPress}
                testID={testID}
            >
                <Icon icon={icon} size={PILL_ICON_SIZE} className="text-secondary-foreground" />
                <Text className="text-sm text-default-foreground pr-xs">{label}</Text>
            </HapticPressable>
        </Animated.View>
    );
};
