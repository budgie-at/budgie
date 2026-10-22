import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Link } from 'expo-router';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { PinSetupModeEnum } from '../../../auth/enum/pin-setup-mode.enum';
import { useBiometricLabel } from '../../hook/use-biometric-label.hook';
import { useSetting } from '../../hook/use-setting.hook';
import { updateSettingsMutation } from '../../mutation/update-settings.mutation';

export const PinManagementRows = () => {
    const isBiometricEnabled = useSetting('isBiometricEnabled');
    const biometricLabel = useBiometricLabel();

    const changePinHref = { pathname: '/settings/pin', params: { mode: PinSetupModeEnum.CHANGE } } as const;
    const disablePinHref = { pathname: '/settings/pin', params: { mode: PinSetupModeEnum.DISABLE } } as const;

    const handleToggleBiometric = async (value: boolean) => {
        await appRuntime.runPromise(updateSettingsMutation({ isBiometricEnabled: value }));
    };

    return (
        <View className="gap-y-xl pb-xl pl-[48px]">
            {isDefined(biometricLabel) ? (
                <View className="flex-row items-center gap-x-md">
                    <Icon icon={UserIconNameEnum.Fingerprint} size={16} className="text-secondary-foreground" />

                    <Text className="mr-auto text-sm text-primary">{biometricLabel}</Text>

                    <ThemedSwitch
                        testID={SettingsPageSelector.AppLockBiometricSwitch}
                        onValueChange={handleToggleBiometric}
                        value={isBiometricEnabled}
                    />
                </View>
            ) : null}

            <Link href={changePinHref} asChild>
                <HapticPressable className="flex-row items-center gap-x-md" testID={SettingsPageSelector.AppLockChangePinButton}>
                    <Icon icon={UserIconNameEnum.KeyRound} size={16} className="text-secondary-foreground" />

                    <Text className="mr-auto text-sm text-primary">
                        <Trans>Change PIN</Trans>
                    </Text>

                    <Icon icon={UserIconNameEnum.ChevronRight} className="text-secondary-foreground" size={16} />
                </HapticPressable>
            </Link>

            <Link href={disablePinHref} asChild>
                <HapticPressable className="self-start py-xs" testID={SettingsPageSelector.AppLockDisableButton}>
                    <Text className="text-sm text-destructive-foreground">
                        <Trans>Disable App Lock</Trans>
                    </Text>
                </HapticPressable>
            </Link>
        </View>
    );
};
