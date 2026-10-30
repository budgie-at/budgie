import { View } from 'react-native';

import { CategorizeInboxClusterRow } from '../categorize-inbox-cluster-row/categorize-inbox-cluster-row';
import { CategorizeInboxDayLabel } from '../categorize-inbox-day-label/categorize-inbox-day-label';

import type { CategorizeInboxDayGroupInterface } from '../../interface/categorize-inbox-day-group.interface';

interface Props {
    readonly group: CategorizeInboxDayGroupInterface;
    readonly displayTitle: string;
    readonly className: string;
}

export const CategorizeInboxPaymentsDay = ({ group, displayTitle, className }: Props) => {
    const dayLabel = <CategorizeInboxDayLabel day={group.day} />;

    return (
        <View className={className}>
            {group.rows.map((row, index) => {
                const leading = index === 0 ? dayLabel : null;

                return <CategorizeInboxClusterRow key={row.transactionId} row={row} displayTitle={displayTitle} leading={leading} />;
            })}
        </View>
    );
};
