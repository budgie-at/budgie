export interface CategorizeInboxMoveToCashInterface {
    readonly movedToCashTransactionIds: number[];
    readonly moveToCash: (transactionIds: number[]) => void;
    readonly undoMoveToCash: (transactionIds: number[]) => void;
    readonly resetMovedToCash: () => void;
}
