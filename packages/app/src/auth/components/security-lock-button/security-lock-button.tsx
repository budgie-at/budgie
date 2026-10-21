import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useSetting } from '../../../settings/hook/use-setting.hook';

import { SecurityLockButtonSelector } from './security-lock-button.selector';

export const SecurityLockButton = () => {
    const { t } = useLingui();
    const isPinEnabled = useSetting('isPinEnabled');

    const handlePress = () => void router.push(isPinEnabled ? { pathname: '/settings', params: { anchor: 'security' } } : '/add-pin');

    const accessibilityLabel = isPinEnabled
        ? t`Your data is sealed. Only your PIN opens it.`
        : t`Phone lock only. Make a PIN to encrypt your data.`;
    const icon = isPinEnabled ? UserIconNameEnum.LockKeyhole : UserIconNameEnum.LockKeyholeOpen;
    const iconClassName = isPinEnabled ? 'text-secondary-foreground' : 'text-dark-warning-foreground';

    return (
        <HapticPressable
            testID={SecurityLockButtonSelector.Root}
            className="ml-md -mr-[34px] size-[26px] items-center justify-center self-center"
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
        >
            <Icon icon={icon} size={20} className={iconClassName} />
        </HapticPressable>
    );
};
