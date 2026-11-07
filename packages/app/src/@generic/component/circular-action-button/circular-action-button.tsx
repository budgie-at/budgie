import { UserIconNameEnum } from '@budgie/contracts';
import { ViewStyle } from 'react-native';
import Animated, { AnimatedStyle } from 'react-native-reanimated';

import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

const ICON_SIZE = 32;

interface Props {
    readonly icon: UserIconNameEnum;
    readonly onPress: () => void;
    readonly animatedStyle?: AnimatedStyle<ViewStyle>;
    readonly testID?: string;
}

export const CircularActionButton = ({ icon, onPress, animatedStyle, testID }: Props) => (
    <HapticPressable
        className="h-18 w-18"
        testID={testID}
        accessibilityLabel={testID}
        accessibilityRole="button"
        collapsable={false}
        onPress={onPress}
    >
        <Animated.View className="bg-primary rounded-full items-center justify-center h-full w-full" style={animatedStyle}>
            <Icon className="text-primary-reverse" icon={icon} size={ICON_SIZE} />
        </Animated.View>
    </HapticPressable>
);
