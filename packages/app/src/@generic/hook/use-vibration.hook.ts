import { ImpactFeedbackStyle, NotificationFeedbackType, impactAsync, notificationAsync, selectionAsync } from 'expo-haptics';

import { useSetting } from '../../settings/hook/use-setting.hook';

export const useVibration = (): [
    notification: (type: NotificationFeedbackType) => void,
    impact: (style: ImpactFeedbackStyle) => void,
    selection: () => void
] => {
    const isVibrationEnabled = useSetting('isVibrationEnabled');

    const hapticNotification = (type: NotificationFeedbackType = NotificationFeedbackType.Success) => {
        if (isVibrationEnabled) {
            void notificationAsync(type);
        }
    };

    const hapticImpact = (style: ImpactFeedbackStyle = ImpactFeedbackStyle.Medium) => {
        if (isVibrationEnabled) {
            void impactAsync(style);
        }
    };

    const hapticSelection = () => {
        if (isVibrationEnabled) {
            void selectionAsync();
        }
    };

    return [hapticNotification, hapticImpact, hapticSelection] as const;
};
