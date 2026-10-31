import { ImpactFeedbackStyle } from 'expo-haptics';
import { Keyboard } from 'react-native';

import { useVibration } from './use-vibration.hook';

export const useSignTogglePress = (onToggle: () => void) => {
    const [, hapticImpact] = useVibration();

    return () => {
        hapticImpact(ImpactFeedbackStyle.Light);
        Keyboard.dismiss();
        onToggle();
    };
};
