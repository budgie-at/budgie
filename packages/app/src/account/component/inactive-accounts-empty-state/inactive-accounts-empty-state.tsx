import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';

export const InactiveAccountsEmptyState = () => (
    <View className="flex-1 items-center justify-center max-w-63.75 mx-auto">
        <View className="bg-dark-warning-background border border-dark-warning-corner rounded-7xl w-29 h-29 items-center justify-center mb-7xl">
            <Icon icon="EyeOff" size={64} className="text-dark-warning-foreground" />
        </View>
        <Text className="text-primary text-center text-3xl font-medium mb-md">
            <Trans>No inactive accounts</Trans>
        </Text>
        <Text className="text-secondary-foreground text-center text-sm">
            <Trans>Accounts you mark as inactive will appear here. They won&apos;t be shown on the main page.</Trans>
        </Text>
    </View>
);
