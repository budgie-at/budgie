import { Trans } from '@lingui/react/macro';
import { Link } from 'expo-router';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';

export const AccountsHeading = () => (
    <View className="flex-row justify-between items-center mb-lg">
        <Text className="text-xs uppercase text-secondary-foreground">
            <Trans>Accounts</Trans>
        </Text>

        <Link href="/(main)/create-account" asChild>
            <HapticPressable>
                <CircleIcon icon="Plus" variant="ghost" size={26} iconSize={14} />
            </HapticPressable>
        </Link>
    </View>
);
