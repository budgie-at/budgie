import { UserIconNameEnum } from '@budgie/contracts';
import { ViewStyle } from 'react-native';
import Animated, { AnimatedStyle } from 'react-native-reanimated';

import { BUTTON_PRESSED_SCALE } from '../../constant/motion.constant';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

const ICON_SIZE = 32;

interface Props {
    readonly icon: UserIconNameEnum;
    readonly label: string;
    readonly onPress: () => void;
    readonly animatedStyle?: AnimatedStyle<ViewStyle>;
    readonly testID?: string;
}

export const CircularActionButton = ({ icon, label, onPress, animatedStyle, testID }: Props) => (
    <HapticPressable
        pressedScale={BUTTON_PRESSED_SCALE}
        className="h-18 w-18"
        testID={testID}
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityShowsLargeContentViewer
        accessibilityLargeContentTitle={label}
        collapsable={false}
        onPress={onPress}
    >
        <Animated.View
            className="h-full w-full items-center justify-center rounded-full bg-primary light:bg-popover-surface"
            style={animatedStyle}
        >
            <Icon className="text-primary-reverse light:text-primary" icon={icon} size={ICON_SIZE} />
        </Animated.View>
    </HapticPressable>
);
