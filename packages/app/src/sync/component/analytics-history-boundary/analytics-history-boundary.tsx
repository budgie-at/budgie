import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { ActivityIndicator, Text, View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { useAnalyticsHistorySyncsQuery } from '../../query/use-analytics-history-syncs.query';
import { AnalyticsSyncAccountProgress } from '../analytics-sync-account-progress/analytics-sync-account-progress';

import type { AccountTypeEnum } from '@budgie/contracts';
import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
    readonly description: string;
    readonly action?: ReactNode;
    readonly accountIds?: readonly number[] | null;
    readonly activeAccountTypes?: readonly AccountTypeEnum[];
}

export const AnalyticsHistoryBoundary = ({ children, description, action, accountIds = null, activeAccountTypes }: Props) => {
    const { t } = useLingui();
    const { syncs, isLoading, hasError, refresh } = useAnalyticsHistorySyncsQuery(accountIds, activeAccountTypes);
    const accessibilityState = { busy: isLoading };

    if (isLoading) {
        return (
            <View
                className="items-center py-7xl"
                accessibilityLabel={t`Checking transaction history`}
                accessibilityState={accessibilityState}
            >
                <ActivityIndicator colorClassName="accent-primary" />
            </View>
        );
    }

    if (hasError) {
        return (
            <View className="gap-y-lg">
                <EmptyState
                    circleIcon={UserIconNameEnum.CloudOff}
                    title={t`Unable to check transaction history`}
                    description={t`Analytics will appear once we can confirm your history is ready.`}
                />
                <Button content={t`Try again`} onPress={refresh} />
            </View>
        );
    }

    if (isNotEmptyArray(syncs)) {
        return (
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
    }

    return children;
};
