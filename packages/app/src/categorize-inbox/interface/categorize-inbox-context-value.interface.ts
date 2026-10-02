import { CategorizeInboxRowInterface } from '@budgie/contracts';

import { CategorizeInboxAssignmentInterface } from './categorize-inbox-assignment.interface';
import { CategorizeInboxClusterInterface } from './categorize-inbox-cluster.interface';
import { CategorizeInboxStrategyInterface } from './categorize-inbox-strategy.interface';
import { CategorizeInboxVisibilityInterface } from './categorize-inbox-visibility.interface';

export interface CategorizeInboxContextValueInterface extends CategorizeInboxVisibilityInterface {
    readonly strategy: CategorizeInboxStrategyInterface;
    readonly assign: (assignments: CategorizeInboxAssignmentInterface[]) => void;
    readonly assignCluster: (cluster: CategorizeInboxClusterInterface, labelId: number) => void;
    readonly pickClusterLabels: (cluster: CategorizeInboxClusterInterface) => Promise<void>;
    readonly pickRowLabels: (row: CategorizeInboxRowInterface) => Promise<void>;
    readonly moveToCash: (transactionIds: number[]) => void;
}
