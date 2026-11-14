import { useLingui } from '@lingui/react/macro';

import { isNotEmptyString } from '@rnw-community/shared';

import { DB_NAME } from '../../@generic/drizzle/constant/db-name.constant';
import { useBiometricLabel } from '../../settings/hook/use-biometric-label.hook';
import { useSetting } from '../../settings/hook/use-setting.hook';

import type { OnboardingReceiptRowInterface } from '../interface/onboarding-receipt-row.interface';

export const useOnboardingReceiptRows = (): OnboardingReceiptRowInterface[] => {
    const { t } = useLingui();
    const isPinEnabled = useSetting('isPinEnabled');
    const isBiometricEnabled = useSetting('isBiometricEnabled');
    const biometricLabel = useBiometricLabel();

    const pinOpensWith = isBiometricEnabled && isNotEmptyString(biometricLabel) ? t`Your PIN · ${biometricLabel}` : t`Your PIN`;
    const opensWith = isPinEnabled ? pinOpensWith : t`This phone’s lock`;

    return [
        { label: t`File`, value: DB_NAME },
        { label: t`Lives on`, value: t`This phone` },
        { label: t`Opens with`, value: opensWith }
    ];
};
