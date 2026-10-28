import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ActivityIndicator } from 'react-native';

import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { TransactionsPageSelector } from '../../../app/(tabs)/transactions-page.selector';

interface Props {
    readonly isLoading: boolean;
    readonly hasFiltersSelected: boolean;
}

export const TransactionListEmptyState = ({ isLoading, hasFiltersSelected }: Props) => {
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
        <EmptyState
            circleIcon={UserIconNameEnum.Receipt}
            title={emptyStateText.title}
            titleClassName="text-md text-primary font-semibold"
            description={emptyStateText.description}
            descriptionClassName="text-center max-w-[250px]"
            testID={TransactionsPageSelector.EmptyState}
        />
    );
};
