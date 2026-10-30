import { CategorizeInboxClusterRow } from '../categorize-inbox-cluster-row/categorize-inbox-cluster-row';
import { CategorizeInboxPaymentsMonthHeader } from '../categorize-inbox-payments-month-header/categorize-inbox-payments-month-header';

import type { CategorizeInboxMonthGroupInterface } from '../../interface/categorize-inbox-month-group.interface';

interface Props {
    readonly group: CategorizeInboxMonthGroupInterface;
    readonly displayTitle: string;
}

export const CategorizeInboxPaymentsMonth = ({ group, displayTitle }: Props) => (
    <>
        <CategorizeInboxPaymentsMonthHeader group={group} />
        {group.rows.map(row => (
            <CategorizeInboxClusterRow key={row.transactionId} row={row} displayTitle={displayTitle} />
        ))}
    </>
);
