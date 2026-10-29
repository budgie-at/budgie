import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useCategorizeInboxContext } from '../context/categorize-inbox.context';
import { isCategorizeInboxCluster } from '../type-guard/is-categorize-inbox-cluster.type-guard';

import type { CategorizeInboxClusterPositionInterface } from '../interface/categorize-inbox-cluster-position.interface';

export const useCategorizeInboxCluster = (clusterKey: string): CategorizeInboxClusterPositionInterface => {
    const router = useRouter();
    const { items, isLoading } = useCategorizeInboxContext();

    const clusters = items.filter(isCategorizeInboxCluster);
    const cluster = clusters.find(candidate => candidate.key === clusterKey) ?? null;
    const navigableClusters = clusters.filter(candidate => candidate.section !== CategorizeInboxSectionEnum.ONE_OFFS);
    const index = navigableClusters.findIndex(candidate => candidate.key === clusterKey);
    const hasSiblings = index >= 0 && navigableClusters.length > 1;
    const nextKey = hasSiblings ? (navigableClusters[(index + 1) % navigableClusters.length]?.key ?? null) : null;
    const position = index >= 0 ? index + 1 : null;

    useEffect(() => {
        if (!isLoading && !isDefined(cluster)) {
            router.dismissTo('/categorize');
        }
    }, [cluster, isLoading, router]);

    return { cluster, position, total: navigableClusters.length, nextKey };
};
