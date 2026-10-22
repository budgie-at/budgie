import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { PinSetupModeEnum } from '../../../auth/enum/pin-setup-mode.enum';
import { useBiometricLabel } from '../../hook/use-biometric-label.hook';
import { useSetting } from '../../hook/use-setting.hook';
import { SettingsDetailRow } from '../settings-detail-row/settings-detail-row';
import { SettingsPillButton } from '../settings-pill-button/settings-pill-button';

export const AppLockRow = () => {
    const { t } = useLingui();
    const isPinEnabled = useSetting('isPinEnabled');
    const isBiometricEnabled = useSetting('isBiometricEnabled');
    const biometricLabel = useBiometricLabel();

    const handleCreatePin = () => void router.push({ pathname: '/settings/pin', params: { mode: PinSetupModeEnum.CREATE } });

    const enableDescription = isDefined(biometricLabel) ? t`PIN and ${biometricLabel}. Encrypts your data.` : t`PIN. Encrypts your data.`;

    if (isPinEnabled) {
        const description = isBiometricEnabled && isDefined(biometricLabel) ? t`On · PIN and ${biometricLabel}` : t`On · PIN`;

        return (
            <SettingsDetailRow
                icon={UserIconNameEnum.Lock}
                variant="positive"
                title={t`App Lock`}
                description={description}
                right={null}
                testID={SettingsPageSelector.AppLockCard}
            />
        );
    }

    return (
        <SettingsDetailRow
            icon={UserIconNameEnum.LockOpen}
            variant="ghost"
            title={t`App Lock`}
            description={enableDescription}
            right={<SettingsPillButton label={t`Enable`} onPress={handleCreatePin} variant="cta" />}
            onPress={handleCreatePin}
            testID={SettingsPageSelector.AppLockCard}
        />
    );
};
