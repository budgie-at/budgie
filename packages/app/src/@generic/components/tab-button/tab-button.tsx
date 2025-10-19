import { ImpactFeedbackStyle } from 'expo-haptics';
import { Pressable, View } from 'react-native';

import { useVibration } from '../../hooks/use-vibration.hook';
import { Icon } from '../icon/icon';


import type { TabTriggerSlotProps } from 'expo-router/ui';
import type { LucideIcon } from 'lucide-react-native';
import type { GestureResponderEvent } from 'react-native';



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
            <View className={`rounded-[20]  ${isFocused ? 'bg-surface-secondary' : ''} p-[12]`}>
                <Icon className="text-text-primary" icon={icon} size={24} strokeWidth={isFocused ? 2.5 : 2} />
            </View>
        </Pressable>
    );
};
