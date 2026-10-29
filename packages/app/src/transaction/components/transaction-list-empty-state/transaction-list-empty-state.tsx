import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { ActivityIndicator, Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { TransactionsPageSelector } from '../../../app/(tabs)/transactions-page.selector';

interface Props {
    readonly isLoading: boolean;
    readonly hasFiltersSelected: boolean;
    readonly onClearFilters: () => void;
}

export const TransactionListEmptyState = ({ isLoading, hasFiltersSelected, onClearFilters }: Props) => {
    const { t } = useLingui();

    if (isLoading) {
        return <ActivityIndicator size="large" />;
    }

    const emptyStateText = hasFiltersSelected
        ? { title: t`No matching transactions`, description: t`Try adjusting your filters to see more results` }
        : {
              title: t`No transactions yet`,
              description: t`Start tracking your spending by using the mic button or adding transactions manually`
          };

    return (
        <View className="flex-1 items-center py-[48px]">
            <View className="flex-2" />

            <CircleIcon
                icon={UserIconNameEnum.Receipt}
                size={56}
                iconSize={26}
                radius={28}
                border={false}
                variant="secondary"
                className="mb-xl bg-secondary-foreground/15"
                iconClassName="text-secondary-foreground"
            />

            <EmptyState
                title={emptyStateText.title}
                titleClassName="text-md text-primary font-semibold"
                description={emptyStateText.description}
                descriptionClassName="text-center max-w-[250px]"
                className="py-0"
                testID={TransactionsPageSelector.EmptyState}
            />

            {hasFiltersSelected ? (
                <HapticPressable
                    onPress={onClearFilters}
                    accessibilityRole="button"
                    className="mt-3xl min-h-[44px] justify-center rounded-full bg-surface-fill px-7xl"
                    testID={TransactionsPageSelector.ClearFiltersButton}
                >
                    <Text className="text-primary text-[15px] font-semibold">
                        <Trans>Clear filters</Trans>
                    </Text>
                </HapticPressable>
            ) : null}

            <View className="flex-3" />
        </View>
    );
};
