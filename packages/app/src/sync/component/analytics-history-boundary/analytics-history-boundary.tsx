import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ActivityIndicator, View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { useAnalyticsHistorySyncsQuery } from '../../query/use-analytics-history-syncs.query';
import { AnalyticsSyncPending } from '../analytics-sync-pending/analytics-sync-pending';

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
        return <AnalyticsSyncPending syncs={syncs} description={description} action={action} />;
    }

    return children;
};
