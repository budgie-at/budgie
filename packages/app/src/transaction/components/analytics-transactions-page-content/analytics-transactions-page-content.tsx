import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ActivityIndicator } from 'react-native';

import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { Page } from '../../../@generic/component/page/page';
import { TransactionSectionsList } from '../transaction-sections-list/transaction-sections-list';
import { TransactionFilterPageHeader } from '../transactions-page-header/transaction-filter-page-header';

import type { AnalyticsTransactionsPageContentPropsInterface } from '../../interface/analytics-transactions-page-content-props.interface';

export const AnalyticsTransactionsPageContent = ({
    headerProps,
    sections,
    isLoading,
    onLoadMore
}: AnalyticsTransactionsPageContentPropsInterface) => {
    const { t } = useLingui();

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
        <Page header={<TransactionFilterPageHeader {...headerProps} />}>
            <TransactionSectionsList
                sections={sections}
                onEndReached={onLoadMore}
                listEmptyState={listEmptyState}
                balanceAdjustmentLabel={t`Balance Adjustment`}
                categoriesLabel={t`Categories`}
                footerSpacerMultiplier={0}
            />
        </Page>
    );
};
