import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { styled } from 'nativewind';
import { Text, View } from 'react-native';

import { SettingsPageSelectors } from '../../../@e2e/selectors/settings-page.selector';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { useAuthContext } from '../../../auth/context/auth.context';
import { PinSetupModeEnum } from '../../../auth/enum/pin-setup-mode.enum';
import { updateSettingsMutation } from '../../mutation/update-settings.mutation';
import { useGetSettingsQuery } from '../../query/use-get-settings.query';

const Gradient = styled(LinearGradient);
const colors = ['rgba(1, 255, 136, 0.10)', 'rgba(0, 0, 0, 0)'] as const;
const locations = [0, 1] as const;
const start = { x: 0, y: 0 };
const end = { x: 1, y: 1 };

export const PinEnabledCard = () => {
    const { settings } = useGetSettingsQuery();
    const { isFaceIdAvailable, isTouchIdAvailable, isSomeAvailable } = useAuthContext();

    const isBiometricEnabled = settings?.isBiometricEnabled === true;

    const handleToggleBiometric = async (value: boolean) => {
        await updateSettingsMutation({ isBiometricEnabled: value });
    };

    return (
        <View className="rounded-5xl bg-secondary-background p-4xl gap-10" testID={SettingsPageSelectors.AppLockCard}>
            <Gradient
                className="w-24 h-24 absolute right-0 top-0 rounded-bl-[100%]"
                locations={locations}
                colors={colors}
                start={start}
                end={end}
            />

            <View className="gap-x-xl flex-row items-center">
                <CircleIcon icon={UserIconNameEnum.Lock} variant="positive" size={40} iconSize={20} border={false} />

                <View className="gap-x-xs">
                    <Text className="text-primary text-md">
                        <Trans>App Lock</Trans>
                    </Text>
                    <View className="flex-row items-center gap-x-md">
                        <View className="w-1.5 h-1.5 rounded-full bg-positive-foreground" />

                        <Text className="text-xs text-positive-foreground">
                            <Trans>Active</Trans>
                        </Text>
                    </View>
                </View>
            </View>

            <View className="gap-y-xl border-t pt-xl border-t-secondary-corner">
                {isSomeAvailable ? (
                    <View className="flex-row items-center gap-x-md">
                        <Icon icon={UserIconNameEnum.Fingerprint} size={16} className="text-secondary-foreground" />

                        <Text className="mr-auto text-primary text-sm">
                            {isTouchIdAvailable && isFaceIdAvailable ? <Trans>Face ID / Touch ID</Trans> : null}
                            {isTouchIdAvailable && !isFaceIdAvailable ? <Trans>Touch ID</Trans> : null}
                            {!isTouchIdAvailable && isFaceIdAvailable ? <Trans>Face ID</Trans> : null}
                        </Text>

                        <ThemedSwitch
                            testID={SettingsPageSelectors.AppLockBiometricSwitch}
                            onValueChange={handleToggleBiometric}
                            value={isBiometricEnabled}
                        />
                    </View>
                ) : null}

                <Link href={`/settings/pin?mode=${PinSetupModeEnum.CHANGE}`} asChild>
                    <HapticPressable className="flex-row items-center gap-x-md " testID={SettingsPageSelectors.AppLockChangePinButton}>
                        <Icon icon={UserIconNameEnum.KeyRound} size={16} className="text-secondary-foreground" />

                        <Text className="mr-auto text-primary text-sm">
                            <Trans>Change PIN</Trans>
                        </Text>

                        <Icon icon={UserIconNameEnum.ChevronRight} className="text-secondary-foreground" size={16} />
                    </HapticPressable>
                </Link>

                <Link href={`/settings/pin?mode=${PinSetupModeEnum.DISABLE}`} asChild>
                    <HapticPressable className="py-md px-xl" testID={SettingsPageSelectors.AppLockDisableButton}>
                        <Text className="text-destructive-foreground text-sm">
                            <Trans>Disable App Lock</Trans>
                        </Text>
                    </HapticPressable>
                </Link>
            </View>
        </View>
    );
};
