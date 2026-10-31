import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { ActivityIndicator, Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { TransactionsPageSelector } from '../../../app/(tabs)/transactions-page.selector';

interface Props {
    readonly isLoading: boolean;
    readonly hasFiltersSelected: boolean;
    readonly periodLabel: string;
}

const continuousCorners = { borderCurve: 'continuous' as const };

export const StatisticsDrillDownEmptyState = ({ isLoading, hasFiltersSelected, periodLabel }: Props) => {
    if (isLoading) {
        return <ActivityIndicator size="large" />;
    }

    return (
        <View
            className="items-center gap-y-md rounded-3xl bg-grouped-surface-row px-3xl py-5xl"
            style={continuousCorners}
            testID={TransactionsPageSelector.EmptyState}
        >
            <CircleIcon
                icon={UserIconNameEnum.Receipt}
                size={44}
                iconSize={20}
                radius={22}
                border={false}
                variant="secondary"
                className="bg-secondary-foreground/15"
                iconClassName="text-secondary-foreground"
            />

            <View className="items-center gap-y-xxs">
                <Text className="text-center text-md font-semibold text-primary">
                    <Trans>No transactions</Trans>
                </Text>
                <Text className="text-center text-sm text-secondary-foreground">{periodLabel}</Text>
            </View>

            <Text className="text-center text-sm text-secondary-foreground">
                {hasFiltersSelected ? (
                    <Trans>Some transactions may be hidden by the account or amount filter.</Trans>
                ) : (
                    <Trans>Nothing booked in this period</Trans>
                )}
            </Text>
        </View>
    );
};
