import { Page } from '../../../@generic/component/page/page';
import { TransactionListEmptyState } from '../transaction-list-empty-state/transaction-list-empty-state';
import { TransactionSectionsList } from '../transaction-sections-list/transaction-sections-list';
import { TransactionFilterPageHeader } from '../transactions-page-header/transaction-filter-page-header';

import type { TransactionFilterPageHeaderPropsInterface } from '../../interface/transaction-filter-page-header-props.interface';
import type { TransactionsByDaySectionInterface } from '../../interface/transactions-by-day-section.interface';

interface Props {
    readonly headerProps: TransactionFilterPageHeaderPropsInterface;
    readonly sections: TransactionsByDaySectionInterface[];
    readonly isLoading: boolean;
    readonly onLoadMore: () => void;
    readonly accountId: number | null;
}

export const AnalyticsTransactionsPageContent = ({ headerProps, sections, isLoading, onLoadMore, accountId }: Props) => (
    <Page header={<TransactionFilterPageHeader {...headerProps} />}>
        <TransactionSectionsList
            sections={sections}
            onEndReached={onLoadMore}
            listEmptyState={<TransactionListEmptyState isLoading={isLoading} hasFiltersSelected />}
            accountId={accountId}
            footerSpacerMultiplier={0}
        />
    </Page>
);
