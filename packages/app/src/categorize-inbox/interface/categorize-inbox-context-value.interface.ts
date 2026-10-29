import { CategorizeInboxAssignmentInterface, CategorizeInboxClusterInterface, CategorizeInboxRowInterface } from '@budgie/categorization';

import { CategorizeInboxLastWriteInterface } from './categorize-inbox-last-write.interface';
import { CategorizeInboxStrategyInterface } from './categorize-inbox-strategy.interface';
import { CategorizeInboxVisibilityInterface } from './categorize-inbox-visibility.interface';

export interface CategorizeInboxContextValueInterface extends CategorizeInboxVisibilityInterface {
    readonly strategy: CategorizeInboxStrategyInterface | null;
    readonly remainingCount: number;
    readonly categorizedCount: number;
    readonly acceptableAssignments: CategorizeInboxAssignmentInterface[];
    readonly cashWithdrawalTransactionIds: ReadonlySet<number>;
    readonly lastWrite: CategorizeInboxLastWriteInterface | null;
    readonly movedToCashTransactionIds: number[];
    readonly assign: (assignments: CategorizeInboxAssignmentInterface[]) => void;
    readonly assignCluster: (cluster: CategorizeInboxClusterInterface, labelId: number) => void;
    readonly pickClusterLabels: (cluster: CategorizeInboxClusterInterface) => void;
    readonly pickRowLabels: (row: CategorizeInboxRowInterface) => void;
    readonly convertClusterToTransfer: (cluster: CategorizeInboxClusterInterface) => void;
    readonly convertRowToTransfer: (row: CategorizeInboxRowInterface) => void;
    readonly moveToCash: (transactionIds: number[]) => void;
    readonly undo: (lastWrite: CategorizeInboxLastWriteInterface) => void;
    readonly applyFollowUp: (lastWrite: CategorizeInboxLastWriteInterface) => void;
    readonly undoMoveToCash: (transactionIds: number[]) => void;
}
