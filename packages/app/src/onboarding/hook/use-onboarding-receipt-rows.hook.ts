import { useLingui } from '@lingui/react/macro';

import { useAuthContext } from '../../auth/context/auth.context';
import { useSetting } from '../../settings/hook/use-setting.hook';

import type { OnboardingReceiptRowInterface } from '../interface/onboarding-receipt-row.interface';

export const useOnboardingReceiptRows = (): OnboardingReceiptRowInterface[] => {
    const { t } = useLingui();
    const isPinEnabled = useSetting('isPinEnabled');
    const isBiometricEnabled = useSetting('isBiometricEnabled');
    const { isFaceIdAvailable } = useAuthContext();

    const biometricOpensWith = isFaceIdAvailable ? t`Your PIN · Face ID` : t`Your PIN · Fingerprint`;
    const pinOpensWith = isBiometricEnabled ? biometricOpensWith : t`Your PIN`;
    const opensWith = isPinEnabled ? pinOpensWith : t`This phone's lock`;

    return [
        { label: t`Opens with`, value: opensWith },
        { label: t`Copies elsewhere`, value: t`None` }
    ];
};
