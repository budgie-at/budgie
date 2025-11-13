import * as Haptics from 'expo-haptics';
import { ImpactFeedbackStyle, NotificationFeedbackType } from 'expo-haptics/src/Haptics.types';

// TODO add "hasVibration" to the settings table

export const useVibration = (): [notification: (type: NotificationFeedbackType) => void, impact: (style: ImpactFeedbackStyle) => void] => {
    const hapticNotification = (type: NotificationFeedbackType = NotificationFeedbackType.Success) => {
        void Haptics.notificationAsync(type);
    };

    const hapticImpact = (style: ImpactFeedbackStyle = ImpactFeedbackStyle.Medium) => {
        void Haptics.impactAsync(style);
    };

    return [hapticNotification, hapticImpact] as const;
};
