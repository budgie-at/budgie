import { ImpactFeedbackStyle } from 'expo-haptics';
import type { GestureResponderEvent } from 'react-native';
import { Pressable, View } from 'react-native';

import { useVibration } from '../../hooks/use-vibration.hook';
import { Icon } from '../icon/icon';

import type { TabTriggerSlotProps } from 'expo-router/ui';
import type { LucideIcon } from 'lucide-react-native';

interface TabButtonProps extends TabTriggerSlotProps {
    readonly icon: LucideIcon;
}

export const TabButton = ({ children, isFocused = false, onPress, icon, style: _, ...rest }: TabButtonProps) => {
    const [, hapticImpact] = useVibration();

    const handlePress = (event: GestureResponderEvent) => {
        hapticImpact(ImpactFeedbackStyle.Light);
        onPress?.(event);
    };

    return (
        <Pressable {...rest} onPress={handlePress}>
            <View className={`rounded-5xl  ${isFocused ? 'bg-ghost-background' : ''} p-xl`}>
                <Icon className={isFocused ? 'stroke-[2.5] text-primary' : 'stroke-2 text-primary/40'} icon={icon} size={24} />
            </View>
        </Pressable>
    );
};
