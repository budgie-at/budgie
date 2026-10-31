import { CategorizeInboxAssignmentInterface, CategorizeInboxClusterInterface, CategorizeInboxListItemType } from '@budgie/categorization';

import { CategorizeInboxLastWriteInterface } from './categorize-inbox-last-write.interface';
import { CategorizeInboxPendingTransferInterface } from './categorize-inbox-pending-transfer.interface';
import { CategorizeInboxStrategyInterface } from './categorize-inbox-strategy.interface';
import { CategorizeInboxVisibilityInterface } from './categorize-inbox-visibility.interface';

export interface CategorizeInboxContextValueInterface extends CategorizeInboxVisibilityInterface {
    readonly strategy: CategorizeInboxStrategyInterface | null;
    readonly items: CategorizeInboxListItemType[];
    readonly isLoading: boolean;
    readonly remainingCount: number;
    readonly categorizedCount: number;
    readonly acceptableAssignments: CategorizeInboxAssignmentInterface[];
    readonly cashWithdrawalTransactionIds: ReadonlySet<number>;
    readonly lastWrite: CategorizeInboxLastWriteInterface | null;
    readonly movedToCashTransactionIds: number[];
    readonly assign: (assignments: CategorizeInboxAssignmentInterface[]) => void;
    readonly assignCluster: (cluster: CategorizeInboxClusterInterface, labelId: number) => void;
    readonly addClusterTags: (cluster: CategorizeInboxClusterInterface) => void;
    readonly pickClusterLabels: (cluster: CategorizeInboxClusterInterface) => void;
    readonly pendingTransfer: CategorizeInboxPendingTransferInterface | null;
    readonly learnedTransferAccountIds: ReadonlyMap<string, number>;
    readonly transferCluster: (
        cluster: CategorizeInboxClusterInterface,
        accountId: number,
        accountTitle: string,
        isRuleEnabled: boolean
    ) => void;
    readonly undoTransfer: () => void;
    readonly moveToCash: (transactionIds: number[]) => void;
    readonly undo: (lastWrite: CategorizeInboxLastWriteInterface) => void;
    readonly applyFollowUp: (lastWrite: CategorizeInboxLastWriteInterface) => void;
    readonly undoMoveToCash: (transactionIds: number[]) => void;
}
