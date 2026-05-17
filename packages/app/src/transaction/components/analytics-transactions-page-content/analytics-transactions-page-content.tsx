import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ActivityIndicator } from 'react-native';

import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { Page } from '../../../@generic/component/page/page';
import { TransactionSectionsList } from '../transaction-sections-list/transaction-sections-list';

import type { AnalyticsTransactionsPageContentPropsInterface } from '../../interface/analytics-transactions-page-content-props.interface';

export const AnalyticsTransactionsPageContent = ({
    header,
    sections,
    isLoading,
    onLoadMore
}: AnalyticsTransactionsPageContentPropsInterface) => {
    const { t } = useLingui();

    const balanceAdjustmentLabel = t`Balance Adjustment`;
    const categoriesLabel = t`Categories`;

    const listEmptyState = isLoading ? (
        <ActivityIndicator size="large" />
    ) : (
        <EmptyState
            circleIcon={UserIconNameEnum.Receipt}
            title={t`No matching transactions`}
            titleClassName="text-md text-primary font-semibold"
            description={t`Try adjusting your filters to see more results`}
            descriptionClassName="text-center max-w-[250px]"
        />
    );

    return (
        <Page header={header}>
            <TransactionSectionsList
                sections={sections}
                onEndReached={onLoadMore}
                listEmptyState={listEmptyState}
                balanceAdjustmentLabel={balanceAdjustmentLabel}
                categoriesLabel={categoriesLabel}
                footerSpacerMultiplier={0}
            />
        </Page>
    );
};
