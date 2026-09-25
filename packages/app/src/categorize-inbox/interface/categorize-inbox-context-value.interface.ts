import { CategorizeInboxRowInterface } from '@budgie/contracts';

import { CategorizeInboxClusterInterface } from './categorize-inbox-cluster.interface';

export interface CategorizeInboxContextValueInterface {
    readonly excludedTransactionIds: ReadonlySet<number>;
    readonly expandedClusterKey: string | null;
    readonly isBusy: boolean;
    readonly toggleExpanded: (key: string) => void;
    readonly toggleExcluded: (transactionId: number) => void;
    readonly assignCluster: (cluster: CategorizeInboxClusterInterface, categoryId: number) => Promise<void>;
    readonly assignRow: (row: CategorizeInboxRowInterface, categoryId: number) => Promise<void>;
    readonly pickOtherCategory: (cluster: CategorizeInboxClusterInterface) => Promise<void>;
    readonly convertClusterToTransfer: (cluster: CategorizeInboxClusterInterface) => Promise<void>;
}
