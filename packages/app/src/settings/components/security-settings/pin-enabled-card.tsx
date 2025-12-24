import { Trans } from '@lingui/react/macro';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { styled } from 'nativewind';
import { Switch, Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
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
        <View className="rounded-5xl bg-secondary-background p-4xl gap-[40px]">
            <Gradient
                className="w-[96px] h-[96px] absolute right-0 top-0 rounded-bl-[100%]"
                locations={locations}
                colors={colors}
                start={start}
                end={end}
            />

            <View className="gap-x-xl flex-row items-center">
                <CircleIcon icon={ICONS.Lock} variant="positive" size="1_5xl" border={false} />

                <View className="gap-x-xs">
                    <Text className="text-primary text-md">
                        <Trans>App Lock</Trans>
                    </Text>
                    <View className="flex-row items-center gap-x-md">
                        <View className="w-[6px] h-[6px] rounded-full bg-positive-foreground" />

                        <Text className="text-xs text-positive-foreground">
                            <Trans>Active</Trans>
                        </Text>
                    </View>
                </View>
            </View>

            <View className="gap-y-xl border-t pt-xl border-t-secondary-corner">
                {isSomeAvailable ? (
                    <View className="flex-row items-center gap-x-md">
                        <Icon icon={ICONS.Fingerprint} size={16} className="text-secondary-foreground" />

                        <Text className="mr-auto text-primary text-sm">
                            {isTouchIdAvailable && isFaceIdAvailable ? <Trans>Face ID / Touch ID</Trans> : null}
                            {isTouchIdAvailable && !isFaceIdAvailable ? <Trans>Touch ID</Trans> : null}
                            {!isTouchIdAvailable && isFaceIdAvailable ? <Trans>Face ID</Trans> : null}
                        </Text>

                        <Switch onValueChange={handleToggleBiometric} value={isBiometricEnabled} />
                    </View>
                ) : null}

                <Link href={`/settings/pin?mode=${PinSetupModeEnum.CHANGE}`} asChild>
                    <HapticPressable className="flex-row items-center gap-x-md ">
                        <Icon icon={ICONS.KeyRound} size={16} className="text-secondary-foreground" />

                        <Text className="mr-auto text-primary text-sm">
                            <Trans>Change PIN</Trans>
                        </Text>

                        <Icon icon={ICONS.ChevronRight} className="text-secondary-foreground" size={16} />
                    </HapticPressable>
                </Link>

                <Link href={`/settings/pin?mode=${PinSetupModeEnum.DISABLE}`} asChild>
                    <HapticPressable className="py-md px-xl">
                        <Text className="text-destructive-foreground text-sm">
                            <Trans>Disable App Lock</Trans>
                        </Text>
                    </HapticPressable>
                </Link>
            </View>
        </View>
    );
};
