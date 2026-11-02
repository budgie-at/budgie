import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { PinSetupModeEnum } from '../../../auth/enum/pin-setup-mode.enum';
import { SettingsRowAccessoryKindEnum } from '../../enum/settings-row-accessory-kind.enum';
import { useBiometricLabel } from '../../hook/use-biometric-label.hook';
import { useSetting } from '../../hook/use-setting.hook';
import { SettingsRowAccessory } from '../settings-row-accessory/settings-row-accessory';
import { SettingsRow } from '../settings-row/settings-row';

export const AppLockRow = () => {
    const { t } = useLingui();
    const isPinEnabled = useSetting('isPinEnabled');
    const isBiometricEnabled = useSetting('isBiometricEnabled');
    const biometricLabel = useBiometricLabel();

    const handleCreatePin = () => void router.push({ pathname: '/pin-setup', params: { mode: PinSetupModeEnum.CREATE } });

    if (isPinEnabled) {
        const description = isBiometricEnabled && isDefined(biometricLabel) ? t`Encrypted · PIN and ${biometricLabel}` : t`Encrypted · PIN`;

        return (
            <SettingsRow
                icon={UserIconNameEnum.Lock}
                variant="positive"
                title={t`App lock`}
                subtitle={description}
                right={
                    <SettingsRowAccessory
                        value={t`On`}
                        kind={SettingsRowAccessoryKindEnum.ACTION}
                        testID={SettingsPageSelector.DataEncryptionStateOn}
                    />
                }
                testID={SettingsPageSelector.AppLockCard}
            />
        );
    }

    const enableDescription = isDefined(biometricLabel)
        ? t`Encrypt with a PIN, unlock with ${biometricLabel}`
        : t`Encrypt your data with a PIN`;

    return (
        <SettingsRow
            icon={UserIconNameEnum.LockOpen}
            variant="ghost"
            title={t`App lock`}
            subtitle={enableDescription}
            right={<SettingsRowAccessory value={t`Off`} testID={SettingsPageSelector.DataEncryptionStateOff} />}
            onPress={handleCreatePin}
            testID={SettingsPageSelector.AppLockCard}
        />
    );
};
