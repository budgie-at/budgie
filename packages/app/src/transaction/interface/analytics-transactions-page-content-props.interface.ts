import type { TransactionFilterPageHeaderPropsInterface } from './transaction-filter-page-header-props.interface';
import type { TransactionsByMonthSection } from './transactions-by-month-section.type';

export interface AnalyticsTransactionsPageContentPropsInterface {
    readonly headerProps: TransactionFilterPageHeaderPropsInterface;
    readonly sections: TransactionsByMonthSection[];
    readonly isLoading: boolean;
    readonly onLoadMore: () => void;
}
