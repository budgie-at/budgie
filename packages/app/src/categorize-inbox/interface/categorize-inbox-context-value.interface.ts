import { CategoryEntityInterface, CategorizeInboxRowInterface } from '@budgie/contracts';

import { CategorizeInboxAssignmentInterface } from './categorize-inbox-assignment.interface';
import { CategorizeInboxClusterInterface } from './categorize-inbox-cluster.interface';

export interface CategorizeInboxContextValueInterface {
    readonly categoriesById: ReadonlyMap<number, Pick<CategoryEntityInterface, 'id' | 'title' | 'icon'>>;
    readonly excludedTransactionIds: ReadonlySet<number>;
    readonly formatMicroAmount: (microAmount: number, instrumentSymbol: string) => string;
    readonly formatBaseMicroAmount: (microAmount: number) => string;
    readonly formatDate: (date: Date) => string;
    readonly toggleExpanded: (clusterKey: string) => void;
    readonly toggleExcluded: (transactionId: number) => void;
    readonly assign: (assignments: CategorizeInboxAssignmentInterface[]) => void;
    readonly assignCluster: (cluster: CategorizeInboxClusterInterface, categoryId: number) => void;
    readonly assignRow: (row: CategorizeInboxRowInterface, categoryId: number) => void;
    readonly pickClusterCategory: (cluster: CategorizeInboxClusterInterface) => Promise<void>;
    readonly pickRowCategory: (row: CategorizeInboxRowInterface) => Promise<void>;
}
