import * as Haptics from 'expo-haptics';
import { ImpactFeedbackStyle, NotificationFeedbackType } from 'expo-haptics/src/Haptics.types';

import { useSettingsContext } from '../../settings/context/settings.context';

export const useVibration = (): [notification: (type: NotificationFeedbackType) => void, impact: (style: ImpactFeedbackStyle) => void] => {
    const { settings } = useSettingsContext();
    const { isVibrationEnabled } = settings;

    const hapticNotification = (type: NotificationFeedbackType = NotificationFeedbackType.Success) => {
        if (isVibrationEnabled) {
            void Haptics.notificationAsync(type);
        }
    };

    const hapticImpact = (style: ImpactFeedbackStyle = ImpactFeedbackStyle.Medium) => {
        if (isVibrationEnabled) {
            void Haptics.impactAsync(style);
        }
    };

    return [hapticNotification, hapticImpact] as const;
};
