import { UserIconNameEnum } from '@budgie/contracts';
import { ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly iconClassName?: string;
    readonly onPress?: () => void;
    readonly disabled: boolean;
    readonly delay: number;
    readonly containerClassName: string;
    readonly testID: string;
    readonly children: ReactNode;
}

const ANIMATION_DURATION = 200;

export const AiTranslationField = (props: Props) => {
    const { icon, iconClassName = 'text-secondary-foreground', onPress, disabled, delay, containerClassName, testID, children } = props;

    return (
        <Animated.View entering={FadeInUp.delay(delay).duration(ANIMATION_DURATION)} className={containerClassName}>
            <HapticPressable className="flex-row items-center" onPress={onPress} disabled={disabled} testID={testID}>
                <Icon icon={icon} size={18} className={iconClassName} />
                <View className="ml-lg flex-1">{children}</View>
            </HapticPressable>
        </Animated.View>
    );
};
