import { Trans } from '@lingui/react/macro';
import { Switch, Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';

interface Props {
    readonly syncEnabled: boolean;
    readonly onToggle: (enabled: boolean) => void;
}

export const SyncToggleCard = ({ syncEnabled, onToggle }: Props) => (
    <Card className="p-5xl">
        <View className="flex-row items-center justify-between">
            <View className="flex-1">
                <Text className="text-primary text-foreground text-md font-medium mb-xs">
                    <Trans>Enable Auto-Sync</Trans>
                </Text>
                <Text className="text-primary text-muted-foreground text-sm">
                    <Trans>Automatically sync your accounts and transactions</Trans>
                </Text>
            </View>
            <Switch value={syncEnabled} onValueChange={onToggle} />
        </View>
    </Card>
);
