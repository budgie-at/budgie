import { View } from 'react-native';

import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxClusterRow } from '../categorize-inbox-cluster-row/categorize-inbox-cluster-row';

import type { CategorizeInboxClusterInterface } from '../../interface/categorize-inbox-cluster.interface';

interface Props {
    readonly cluster: Pick<CategorizeInboxClusterInterface, 'key' | 'displayTitle' | 'rows'>;
}

export const CategorizeInboxClusterRows = ({ cluster }: Props) => {
    const { expandedClusterKey } = useCategorizeInboxContext();

    if (expandedClusterKey !== cluster.key) {
        return null;
    }

    return (
        <View className="border-t border-secondary-corner gap-y-lg pt-lg">
            {cluster.rows.map(row => (
                <CategorizeInboxClusterRow key={row.transactionId} row={row} displayTitle={cluster.displayTitle} />
            ))}
        </View>
    );
};
