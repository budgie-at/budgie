import { useIsFocused, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useCategorizeInboxContext } from '../context/categorize-inbox.context';
import { isCategorizeInboxCluster } from '../type-guard/is-categorize-inbox-cluster.type-guard';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

export const useCategorizeInboxCluster = (clusterKey: string): CategorizeInboxClusterInterface | null => {
    const router = useRouter();
    const isFocused = useIsFocused();
    const { items, isLoading } = useCategorizeInboxContext();

    const liveCluster = items.filter(isCategorizeInboxCluster).find(candidate => candidate.key === clusterKey) ?? null;
    const [shownClusterState, setShownClusterState] = useState({ key: clusterKey, cluster: liveCluster });

    if (shownClusterState.key !== clusterKey) {
        setShownClusterState({ key: clusterKey, cluster: liveCluster });
    }

    const shownCluster = shownClusterState.key === clusterKey ? shownClusterState.cluster : liveCluster;
    const liveTransactionIds = new Set(liveCluster?.rows.map(row => row.transactionId));
    const isStale = isDefined(shownCluster)
        ? !shownCluster.rows.every(row => liveTransactionIds.has(row.transactionId))
        : !isDefined(liveCluster);

    if (shownClusterState.key === clusterKey && !isStale && isDefined(liveCluster) && liveCluster !== shownCluster) {
        setShownClusterState({ key: clusterKey, cluster: liveCluster });
    }

    useEffect(() => {
        if (isFocused && !isLoading && isStale) {
            router.dismissTo('/categorize');
        }
    }, [isFocused, isLoading, isStale, router]);

    return shownCluster ?? liveCluster;
};
