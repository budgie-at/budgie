import { Trans } from '@lingui/react/macro';
import { Link } from 'expo-router';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/components/haptic-pressable/haptic-pressable';
import { ICONS } from '../../../@generic/constant/icons.constant';

export const AccountsHeading = () => (
    <View className="flex-row justify-between items-center mb-lg">
        <Text className="text-xs uppercase text-secondary-foreground">
            <Trans>Accounts</Trans>
        </Text>

        <Link href="/(main)/create-account" asChild>
            <HapticPressable>
                <CircleIcon icon={ICONS.Plus} variant="ghost" size="lg" />
            </HapticPressable>
        </Link>
    </View>
);
