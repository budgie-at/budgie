import { Trans } from '@lingui/react/macro';
import { Switch, Text, View } from 'react-native';

import { Card } from '../../../@generic/components/card/card';

interface Props {
    readonly isSyncing: boolean;
    readonly syncEnabled: boolean;
    readonly onToggle: (enabled: boolean) => void;
}

export const SyncToggleCard = ({ isSyncing, syncEnabled, onToggle }: Props) => (
    <Card className="p-5xl">
        <View className="flex-row items-center justify-between">
            <View className="flex-1">
                <Text className="text-primary text-foreground text-md font-medium mb-xs">
                    <Trans>Enable Auto-Sync</Trans>
                </Text>
                <Text className="text-primary text-muted-foreground text-sm">
                    {isSyncing ? <Trans>Syncing in progress...</Trans> : <Trans>Automatically sync every hour</Trans>}
                </Text>
            </View>
            <Switch value={syncEnabled} onValueChange={onToggle} />
        </View>
    </Card>
);
