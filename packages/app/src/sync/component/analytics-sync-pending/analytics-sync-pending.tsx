import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { AnalyticsSyncAccountProgress } from '../analytics-sync-account-progress/analytics-sync-account-progress';

import type { AnalyticsHistorySyncInterface } from '../../interface/analytics-history-sync.interface';
import type { ReactNode } from 'react';

interface Props {
    readonly syncs: readonly AnalyticsHistorySyncInterface[];
    readonly description: string;
    readonly action?: ReactNode;
}

export const AnalyticsSyncPending = ({ syncs, description, action }: Props) => (
    <View className="rounded-5xl border border-secondary-corner bg-secondary-background p-5xl gap-y-3xl">
        <View className="items-center gap-y-lg">
            <CircleIcon icon={UserIconNameEnum.ChartNoAxesCombined} variant="ghost" size={64} iconSize={32} />
            <Text className="text-primary text-md font-semibold text-center">
                <Trans>Your analytics are taking shape</Trans>
            </Text>
            <Text className="text-secondary-foreground text-sm text-center">{description}</Text>
        </View>

        {action}

        <View className="gap-y-3xl">
            {syncs.map(history => (
                <AnalyticsSyncAccountProgress key={history.account.id} history={history} />
            ))}
        </View>
    </View>
);
