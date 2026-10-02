import type { CategorizeInboxContextValueInterface } from './categorize-inbox-context-value.interface';
import type { CategorizeInboxLastWriteInterface } from './categorize-inbox-last-write.interface';

export interface CategorizeInboxActionsInterface {
    readonly contextValue: CategorizeInboxContextValueInterface;
    readonly lastWrite: CategorizeInboxLastWriteInterface | null;
    readonly undo: (lastWrite: CategorizeInboxLastWriteInterface) => void;
    readonly applyFollowUp: (lastWrite: CategorizeInboxLastWriteInterface) => Promise<void>;
    readonly movedToCashTransactionIds: number[];
    readonly undoMoveToCash: (transactionIds: number[]) => void;
}
