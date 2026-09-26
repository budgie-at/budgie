import { CategoryEntityInterface, CategorizeInboxRowInterface } from '@budgie/contracts';

import { CategorizeInboxAssignmentInterface } from './categorize-inbox-assignment.interface';
import { CategorizeInboxClusterInterface } from './categorize-inbox-cluster.interface';

export interface CategorizeInboxContextValueInterface {
    readonly categoriesById: ReadonlyMap<number, Pick<CategoryEntityInterface, 'id' | 'title' | 'icon'>>;
    readonly excludedTransactionIds: ReadonlySet<number>;
    readonly expandedClusterKey: string | null;
    readonly undoAssignments: CategorizeInboxAssignmentInterface[] | null;
    readonly toggleExpanded: (clusterKey: string) => void;
    readonly toggleExcluded: (transactionId: number) => void;
    readonly hideTransactions: (transactionIds: readonly number[]) => void;
    readonly showTransactions: (transactionIds: readonly number[]) => void;
    readonly assign: (assignments: CategorizeInboxAssignmentInterface[]) => void;
    readonly assignCluster: (cluster: CategorizeInboxClusterInterface, categoryId: number) => void;
    readonly assignRow: (row: CategorizeInboxRowInterface, categoryId: number) => void;
    readonly undo: () => void;
}
