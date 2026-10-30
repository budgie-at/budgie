import { View } from 'react-native';

import { CategorizeInboxClusterRow } from '../categorize-inbox-cluster-row/categorize-inbox-cluster-row';
import { CategorizeInboxOptionCard } from '../categorize-inbox-option-card/categorize-inbox-option-card';
import { CategorizeInboxPaymentsMonthHeader } from '../categorize-inbox-payments-month-header/categorize-inbox-payments-month-header';

import type { CategorizeInboxMonthGroupInterface } from '../../interface/categorize-inbox-month-group.interface';

interface Props {
    readonly group: CategorizeInboxMonthGroupInterface;
    readonly displayTitle: string;
}

export const CategorizeInboxPaymentsMonth = ({ group, displayTitle }: Props) => (
    <View>
        <CategorizeInboxPaymentsMonthHeader group={group} />
        <CategorizeInboxOptionCard>
            {group.rows.map(row => (
                <CategorizeInboxClusterRow key={row.transactionId} row={row} displayTitle={displayTitle} />
            ))}
        </CategorizeInboxOptionCard>
    </View>
);
