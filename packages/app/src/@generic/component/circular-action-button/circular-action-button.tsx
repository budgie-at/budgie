import { UserIconNameEnum } from '@budgie/contracts';
import { Pressable, ViewStyle } from 'react-native';
import Animated, { AnimatedStyle } from 'react-native-reanimated';

import { Icon } from '../icon/icon';

const ICON_SIZE = 32;

interface Props {
    readonly icon: UserIconNameEnum;
    readonly onPress: () => void;
    readonly animatedStyle?: AnimatedStyle<ViewStyle>;
}

export const CircularActionButton = ({ icon, onPress, animatedStyle }: Props) => (
    <Pressable testID="ActionButton" onPress={onPress}>
        <Animated.View className="bg-primary rounded-full items-center justify-center w-18 h-18" style={animatedStyle}>
            <Icon className="text-primary-reverse" icon={icon} size={ICON_SIZE} />
        </Animated.View>
    </Pressable>
);
