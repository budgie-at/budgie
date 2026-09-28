import type { CategorizeInboxClusterInterface } from './categorize-inbox-cluster.interface';
import type { CategorizeInboxRowInterface } from '@budgie/contracts';

export interface CategorizeInboxVisibilityInterface {
    readonly excludedTransactionIds: ReadonlySet<number>;
    readonly expandedClusterKey: string | null;
    readonly includedRows: (cluster: CategorizeInboxClusterInterface) => CategorizeInboxRowInterface[];
    readonly toggleExpanded: (clusterKey: string) => void;
    readonly toggleExcluded: (transactionId: number) => void;
    readonly hideTransactions: (transactionIds: readonly number[]) => void;
    readonly showTransactions: (transactionIds: readonly number[]) => void;
}
