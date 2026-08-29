import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Button } from '../../../@generic/component/button/button';
import { SyncTokenSectionSelector } from '../sync-token-section/sync-token-section.selector';

interface Props {
    readonly onEdit: () => void;
}

export const BinanceSyncTokenSummary = ({ onEdit }: Props) => {
    const { t } = useLingui();

    return (
        <View className="gap-y-sm">
            <View className="flex-row items-center justify-between">
                <View className="gap-y-xs">
                    <Text className="text-xs text-secondary-foreground">
                        <Trans>Paste your Binance API key:</Trans>
                    </Text>
                    <Text className="text-primary text-sm font-mono">••••••••</Text>
                </View>
                <Button variant="default" size="sm" onPress={onEdit} content={t`Change`} testID={SyncTokenSectionSelector.ChangeButton} />
            </View>

            <View className="gap-y-xs">
                <Text className="text-xs text-secondary-foreground">
                    <Trans>Paste your Binance API secret:</Trans>
                </Text>
                <Text className="text-primary text-sm font-mono">••••••••</Text>
            </View>
        </View>
    );
};
