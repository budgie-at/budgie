import { NotificationFeedbackType } from 'expo-haptics';

import { useVibration } from '../../@generic/hook/use-vibration.hook';

interface ValidationCheck {
    readonly isValid: boolean;
    readonly shake?: () => void;
}

interface UseQuickFormValidationResult {
    readonly validateAndShake: (checks: ValidationCheck[]) => boolean;
}

export const useQuickFormValidation = (): UseQuickFormValidationResult => {
    const [hapticNotification] = useVibration();

    const validateAndShake = (checks: ValidationCheck[]): boolean => {
        const failedChecks = checks.filter(check => !check.isValid);

        if (failedChecks.length > 0) {
            hapticNotification(NotificationFeedbackType.Error);
            failedChecks.forEach(check => check.shake?.());

            return false;
        }

        return true;
    };

    return { validateAndShake };
};
