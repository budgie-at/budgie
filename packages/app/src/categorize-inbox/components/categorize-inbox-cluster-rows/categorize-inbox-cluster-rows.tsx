import { View } from 'react-native';

import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxExceptionRow } from '../categorize-inbox-exception-row/categorize-inbox-exception-row';

import type { CategorizeInboxClusterInterface } from '../../interface/categorize-inbox-cluster.interface';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxClusterRows = ({ cluster }: Props) => {
    const { excludedTransactionIds } = useCategorizeInboxContext();

    return (
        <View className="gap-y-xs border-t border-secondary-background pt-sm">
            {cluster.rows.map(row => (
                <CategorizeInboxExceptionRow key={row.transactionId} row={row} isExcluded={excludedTransactionIds.has(row.transactionId)} />
            ))}
        </View>
    );
};
