import * as Haptics from 'expo-haptics';
import { ImpactFeedbackStyle, NotificationFeedbackType } from 'expo-haptics/src/Haptics.types';

import { useGetSettingsQuery } from '../../@settings/query/use-get-settings.query';

export const useVibration = (): [notification: (type: NotificationFeedbackType) => void, impact: (style: ImpactFeedbackStyle) => void] => {
    const { settings } = useGetSettingsQuery();
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
