import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useCategorizeInboxContext } from '../context/categorize-inbox.context';
import { isCategorizeInboxCluster } from '../type-guard/is-categorize-inbox-cluster.type-guard';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

export const useCategorizeInboxCluster = (clusterKey: string): CategorizeInboxClusterInterface | null => {
    const router = useRouter();
    const { items, isLoading } = useCategorizeInboxContext();

    const clusters = items.filter(isCategorizeInboxCluster);
    const liveCluster = clusters.find(candidate => candidate.key === clusterKey) ?? null;
    const [lastCluster, setLastCluster] = useState(liveCluster);

    if (isDefined(liveCluster) && liveCluster !== lastCluster) {
        setLastCluster(liveCluster);
    }

    const cluster = liveCluster ?? lastCluster;

    useEffect(() => {
        if (!isLoading && !isDefined(cluster)) {
            router.dismissTo('/categorize');
        }
    }, [cluster, isLoading, router]);

    return cluster;
};
