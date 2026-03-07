import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { useVibration } from '../../hook/use-vibration.hook';
import { Icon } from '../icon/icon';

import type { Href } from 'expo-router';
import type { TabTriggerSlotProps } from 'expo-router/ui';
import type { GestureResponderEvent } from 'react-native';

interface TabButtonProps extends Omit<TabTriggerSlotProps, 'href'> {
    readonly icon: UserIconNameEnum;
    readonly navigateTo?: Href;
}

const TAB_SIZE = 52;
const ICON_SIZE = 24;

const tabVariants = cva('items-center justify-center rounded-full', {
    variants: {
        isFocused: {
            true: 'bg-primary',
            false: 'bg-primary/10'
        }
    }
});

const tabIconVariants = cva('', {
    variants: {
        isFocused: {
            true: 'text-primary-reverse',
            false: 'text-secondary-foreground'
        }
    }
});

export const TabButton = ({ children, isFocused = false, onPress, icon, navigateTo, style: _, testID, ...rest }: TabButtonProps) => {
    const [, hapticImpact] = useVibration();

    const handlePress = (event: GestureResponderEvent) => {
        hapticImpact(ImpactFeedbackStyle.Light);

        if (navigateTo) {
            router.push(navigateTo);
        } else {
            onPress?.(event);
        }
    };

    const tabStyle = { width: TAB_SIZE, height: TAB_SIZE };

    return (
        <Pressable {...rest} onPress={handlePress} testID={testID}>
            <View className={tabVariants({ isFocused })} style={tabStyle}>
                <Icon className={tabIconVariants({ isFocused })} icon={icon} size={ICON_SIZE} />
            </View>
        </Pressable>
    );
};
