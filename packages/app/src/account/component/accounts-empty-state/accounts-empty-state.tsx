import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';

export const AccountsEmptyState = () => (
    <View className="items-center max-w-62.5 mx-auto">
        <View className="rounded-full bg-secondary-background border border-secondary-corner p-7xl mb-3xl">
            <Icon className="text-secondary-foreground" icon="Wallet" size={48} />
        </View>

        <Text className="text-primary text-md mb-lg">
            <Trans>No accounts yet</Trans>
        </Text>
        <Text className="text-secondary-foreground text-sm text-center">
            <Trans>Add your first account to start tracking your finances</Trans>
        </Text>
    </View>
);
