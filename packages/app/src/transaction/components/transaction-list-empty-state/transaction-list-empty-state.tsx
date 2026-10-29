import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { ActivityIndicator, Text, View } from 'react-native';

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
        <View className="flex-1 items-center justify-center py-[48px]">
            <EmptyState
                circleIcon={UserIconNameEnum.Receipt}
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
                    className="mt-xl px-xl py-sm"
                    testID={TransactionsPageSelector.ClearFiltersButton}
                >
                    <Text className="text-default-foreground text-[15px] font-semibold">
                        <Trans>Clear filters</Trans>
                    </Text>
                </HapticPressable>
            ) : null}
        </View>
    );
};
