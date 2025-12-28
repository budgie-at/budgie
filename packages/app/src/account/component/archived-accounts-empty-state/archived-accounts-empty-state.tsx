import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';

export const ArchivedAccountsEmptyState = () => (
    <View className="flex-1 items-center justify-center max-w-[255px] mx-auto">
        <View className="bg-dark-warning-background border border-dark-warning-corner rounded-7xl w-[116px] h-[116px] items-center justify-center mb-7xl">
            <Icon icon="Archive" size={64} className="text-dark-warning-foreground" />
        </View>
        <Text className="text-primary text-center text-3xl font-medium mb-md">
            <Trans>No archived accounts</Trans>
        </Text>
        <Text className="text-secondary-foreground text-center text-sm">
            <Trans>Accounts you archive will appear here. They won&apos;t be included in your totals or main view.</Trans>
        </Text>
    </View>
);
