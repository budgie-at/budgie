import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { PinSetupModeEnum } from '../../../auth/enum/pin-setup-mode.enum';
import { useBiometricLabel } from '../../hook/use-biometric-label.hook';
import { useSetting } from '../../hook/use-setting.hook';
import { updateSettingsMutation } from '../../mutation/update-settings.mutation';
import { SettingsRow } from '../settings-row/settings-row';

const handleChangePin = () => void router.push({ pathname: '/settings/pin', params: { mode: PinSetupModeEnum.CHANGE } });
const handleDisablePin = () => void router.push({ pathname: '/settings/pin', params: { mode: PinSetupModeEnum.DISABLE } });

export const PinManagementRows = () => {
    const { t } = useLingui();
    const isBiometricEnabled = useSetting('isBiometricEnabled');
    const biometricLabel = useBiometricLabel();

    const handleToggleBiometric = (value: boolean) => {
        appRuntime.runFork(
            logAndContinue(updateSettingsMutation({ isBiometricEnabled: value }).pipe(toastOnFailure(t`Could not update settings`)))
        );
    };

    const handleBiometricPress = () => void handleToggleBiometric(!isBiometricEnabled);

    return (
        <>
            {isDefined(biometricLabel) ? (
                <SettingsRow
                    icon={UserIconNameEnum.ScanFace}
                    variant="ghost"
                    title={t`Unlock with ${biometricLabel}`}
                    onPress={handleBiometricPress}
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
