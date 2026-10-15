import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { PinSetupModeEnum } from '../../enum/pin-setup-mode.enum';

import { SecurityStatusChipSelector } from './security-status-chip.selector';

export const SecurityStatusChip = () => {
    const { t } = useLingui();
    const isPinEnabled = useSetting('isPinEnabled');

    const handleSealedPress = () => void router.push({ pathname: '/settings', params: { anchor: 'security' } });
    const handlePhoneLockPress = () => void router.push({ pathname: '/settings/pin', params: { mode: PinSetupModeEnum.CREATE } });

    if (isPinEnabled) {
        return (
            <HapticPressable
                testID={SecurityStatusChipSelector.Root}
                onPress={handleSealedPress}
                accessibilityLabel={t`Your data is sealed. Only your PIN opens it.`}
                className="flex-row items-center gap-x-xs rounded-full border border-positive-corner bg-positive-background px-md py-xs"
            >
                <Icon icon={UserIconNameEnum.Lock} size={12} className="text-positive-foreground" />
                <Text className="text-positive-foreground text-xs font-medium">
                    <Trans>Sealed</Trans>
                </Text>
            </HapticPressable>
        );
    }

    return (
        <HapticPressable
            testID={SecurityStatusChipSelector.Root}
            onPress={handlePhoneLockPress}
            accessibilityLabel={t`Phone lock only. Make a PIN to encrypt your data.`}
            className="flex-row items-center gap-x-xs rounded-full border border-secondary-corner bg-secondary-background px-md py-xs"
        >
            <Icon icon={UserIconNameEnum.LockOpen} size={12} className="text-secondary-foreground" />
            <Text className="text-secondary-foreground text-xs font-medium">
                <Trans>Phone lock only</Trans>
            </Text>
        </HapticPressable>
    );
};
