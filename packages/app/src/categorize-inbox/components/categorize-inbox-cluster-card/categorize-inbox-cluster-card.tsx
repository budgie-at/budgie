import { View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { testID } from '../../../@generic/utils/test-id.util';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxClusterMeta } from '../categorize-inbox-cluster-meta/categorize-inbox-cluster-meta';
import { CategorizeInboxClusterRail } from '../categorize-inbox-cluster-rail/categorize-inbox-cluster-rail';
import { CategorizeInboxClusterRow } from '../categorize-inbox-cluster-row/categorize-inbox-cluster-row';
import { CategorizeInboxClusterSummary } from '../categorize-inbox-cluster-summary/categorize-inbox-cluster-summary';

import { CategorizeInboxClusterCardSelector } from './categorize-inbox-cluster-card.selector';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxClusterCard = ({ cluster }: Props) => {
    const { expandedClusterKey } = useCategorizeInboxContext();

    const { displayTitle, rows } = cluster;
    const isExpanded = expandedClusterKey === cluster.key;

    return (
        <Card size="sm" className="gap-y-xl p-3xl" {...testID(CategorizeInboxClusterCardSelector.Card, cluster.key)}>
            <CategorizeInboxClusterSummary cluster={cluster}>
                <CategorizeInboxClusterMeta cluster={cluster} />
            </CategorizeInboxClusterSummary>

            <CategorizeInboxClusterRail cluster={cluster} />

            {isExpanded ? (
                <View className="gap-y-xxs rounded-3xl bg-secondary-background px-md py-xs">
                    {rows.map(row => (
                        <CategorizeInboxClusterRow key={row.transactionId} row={row} displayTitle={displayTitle} />
                    ))}
                </View>
            ) : null}
        </Card>
    );
};
