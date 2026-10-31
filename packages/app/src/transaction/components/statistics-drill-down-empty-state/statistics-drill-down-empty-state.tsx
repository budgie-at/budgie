import { TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { ActivityIndicator, Text } from 'react-native';

import { StatsEmptyCard } from '../../../@generic/component/stats-empty-card/stats-empty-card';
import { TransactionsPageSelector } from '../../../app/(tabs)/transactions-page.selector';

interface Props {
    readonly isLoading: boolean;
    readonly hasFiltersSelected: boolean;
    readonly type: TransactionTypeEnum.INCOME | TransactionTypeEnum.EXPENSE;
}

export const StatisticsDrillDownEmptyState = ({ isLoading, hasFiltersSelected, type }: Props) => {
    const { t } = useLingui();

    if (isLoading) {
        return <ActivityIndicator size="large" />;
    }

    const title = type === TransactionTypeEnum.INCOME ? t`No income` : t`No spending`;

    return (
        <StatsEmptyCard
            icon={UserIconNameEnum.Receipt}
            title={title}

            testID={TransactionsPageSelector.EmptyState}
        >
            {hasFiltersSelected ? (
                <Text className="text-center text-sm text-secondary-foreground">
                    <Trans>Some transactions may be hidden by the account or amount filter.</Trans>
                </Text>
            ) : null}
        </StatsEmptyCard>
    );
};
