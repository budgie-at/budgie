import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { SecurityStatusBadge } from '../security-status-badge/security-status-badge';

import { SecurityStatusChipSelector } from './security-status-chip.selector';

export const SecurityStatusChip = () => {
    const { t } = useLingui();
    const isPinEnabled = useSetting('isPinEnabled');

    const handlePress = () => void router.push(isPinEnabled ? '/settings/your-data' : '/add-pin');

    const accessibilityLabel = isPinEnabled
        ? t`Your data is sealed. Only your PIN opens it.`
        : t`Phone lock only. Make a PIN to encrypt your data.`;

    return (
        <HapticPressable testID={SecurityStatusChipSelector.Root} onPress={handlePress} accessibilityLabel={accessibilityLabel}>
            <SecurityStatusBadge />
        </HapticPressable>
    );
};
