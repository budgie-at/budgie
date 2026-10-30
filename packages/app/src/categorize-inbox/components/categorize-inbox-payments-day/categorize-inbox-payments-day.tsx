import { View } from 'react-native';

import { CategorizeInboxClusterRow } from '../categorize-inbox-cluster-row/categorize-inbox-cluster-row';

import type { CategorizeInboxDayGroupInterface } from '../../interface/categorize-inbox-day-group.interface';

interface Props {
    readonly group: CategorizeInboxDayGroupInterface;
    readonly displayTitle: string;
    readonly className: string;
}

export const CategorizeInboxPaymentsDay = ({ group, displayTitle, className }: Props) => (
    <View className={className}>
        {group.rows.map(row => (
            <CategorizeInboxClusterRow key={row.transactionId} row={row} displayTitle={displayTitle} />
        ))}
    </View>
);
