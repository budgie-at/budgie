import { NotificationFeedbackType } from 'expo-haptics';

import { isNotEmptyArray } from '@rnw-community/shared';

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

        if (isNotEmptyArray(failedChecks)) {
            hapticNotification(NotificationFeedbackType.Error);
            failedChecks.forEach(check => check.shake?.());

            return false;
        }

        return true;
    };

    return { validateAndShake };
};
