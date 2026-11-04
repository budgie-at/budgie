import { TransactionCreateInputInterface } from '@budgie/contracts';
import { NotificationFeedbackType } from 'expo-haptics';
import { useFormContext } from 'react-hook-form';
import { AccessibilityInfo } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useReducedMotion } from '../../@generic/hook/use-reduced-motion.hook';
import { useVibration } from '../../@generic/hook/use-vibration.hook';

import type { QuickFormValidationCheckInterface } from '../interface/quick-form-validation-check.interface';

interface UseQuickFormValidationResult {
    readonly validateAndShake: (checks: QuickFormValidationCheckInterface[]) => boolean;
}

export const useQuickFormValidation = (): UseQuickFormValidationResult => {
    const { setError } = useFormContext<TransactionCreateInputInterface>();
    const [hapticNotification] = useVibration();
    const isReducedMotion = useReducedMotion();

    const validateAndShake = (checks: QuickFormValidationCheckInterface[]): boolean => {
        const failedChecks = checks.filter(check => !check.isValid);
        const firstFailedCheck = failedChecks.at(0);

        if (!isDefined(firstFailedCheck)) {
            return true;
        }

        hapticNotification(NotificationFeedbackType.Error);
        [...failedChecks].reverse().forEach(check => {
            setError(`root.${check.field}`, { type: 'validate', message: check.message });
        });
        AccessibilityInfo.announceForAccessibility(firstFailedCheck.message);

        if (!isReducedMotion) {
            failedChecks.forEach(check => check.shake?.());
        }

        return false;
    };

    return { validateAndShake };
};
