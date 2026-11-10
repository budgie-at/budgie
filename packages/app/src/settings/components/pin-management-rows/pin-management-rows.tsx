import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { PinSetupModeEnum } from '../../../auth/enum/pin-setup-mode.enum';
import { useBiometricLabel } from '../../hook/use-biometric-label.hook';
import { useSetting } from '../../hook/use-setting.hook';
import { runSettingsUpdate } from '../../utils/run-settings-update.util';
import { SettingsRow } from '../settings-row/settings-row';

const handleChangePin = () => void router.push({ pathname: '/pin-setup', params: { mode: PinSetupModeEnum.CHANGE } });
const handleDisablePin = () => void router.push({ pathname: '/pin-setup', params: { mode: PinSetupModeEnum.DISABLE } });

export const PinManagementRows = () => {
    const { t } = useLingui();
    const isBiometricEnabled = useSetting('isBiometricEnabled');
    const biometricLabel = useBiometricLabel();

    const handleToggleBiometric = (value: boolean) => {
        runSettingsUpdate({ isBiometricEnabled: value });
    };

    return (
        <>
            {isDefined(biometricLabel) ? (
                <SettingsRow
                    icon={UserIconNameEnum.ScanFace}
                    variant="ghost"
                    title={t`Unlock with ${biometricLabel}`}
                    right={
                        <ThemedSwitch
                            testID={SettingsPageSelector.AppLockBiometricSwitch}
                            accessibilityLabel={t`Unlock with ${biometricLabel}`}
                            onValueChange={handleToggleBiometric}
                            value={isBiometricEnabled}
                        />
                    }
                />
            ) : null}
            <SettingsRow
                icon={UserIconNameEnum.KeyRound}
                variant="ghost"
                title={t`Change PIN`}
                onPress={handleChangePin}
                testID={SettingsPageSelector.AppLockChangePinButton}
            />
            <SettingsRow
                icon={UserIconNameEnum.LockOpen}
                variant="destructive"
                title={t`Turn off app lock`}
                onPress={handleDisablePin}
                testID={SettingsPageSelector.AppLockDisableButton}
            />
        </>
    );
};
