import type { TransactionsByMonthSection } from './transactions-by-month-section.type';
import type { ReactElement } from 'react';

export interface AnalyticsTransactionsPageContentPropsInterface {
    readonly header: ReactElement;
    readonly sections: TransactionsByMonthSection[];
    readonly isLoading: boolean;
    readonly onLoadMore: () => void;
}
