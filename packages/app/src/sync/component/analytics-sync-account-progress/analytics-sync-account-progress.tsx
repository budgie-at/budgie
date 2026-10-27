import { SyncStatusEnum, UserIconNameEnum } from '@budgie/contracts';
import { resolveInitialSyncProgress } from '@budgie/sync';
import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { getHistoryImportStatusMessage } from '../../utils/get-history-import-status-message.util';
import { SyncImportProgress } from '../sync-import-progress/sync-import-progress';

import type { AnalyticsHistorySyncInterface } from '../../interface/analytics-history-sync.interface';

interface Props {
    readonly history: AnalyticsHistorySyncInterface;
}

export const AnalyticsSyncAccountProgress = ({ history: { account, sync } }: Props) => {
    const { t } = useLingui();
    const needsAttention = !sync.enabled || sync.status === SyncStatusEnum.FAILED;
    const statusText = t(getHistoryImportStatusMessage(sync));
    const progress = needsAttention ? null : resolveInitialSyncProgress([sync]);

    const handleOpenSettings = () => {
        if (isDefined(account.integrationId)) {
            router.push({ pathname: '/bank-integration/[id]', params: { id: String(account.integrationId) } });
        } else {
            router.push('/settings');
        }
    };

    return (
        <View className="gap-y-md">
            <Text className="text-primary text-sm font-medium">{account.title}</Text>
            {isDefined(progress) ? <SyncImportProgress progress={progress} /> : null}
            {needsAttention ? (
                <View className="gap-y-md">
                    <Text className="text-secondary-foreground text-xs">{statusText}</Text>
                    <Text className="text-secondary-foreground text-xs">
                        <Trans>Finish importing this account’s history to include it in analytics.</Trans>
                    </Text>
                    <Button content={t`Review sync settings`} leftIcon={UserIconNameEnum.Settings} onPress={handleOpenSettings} size="sm" />
                </View>
            ) : null}
        </View>
    );
};
