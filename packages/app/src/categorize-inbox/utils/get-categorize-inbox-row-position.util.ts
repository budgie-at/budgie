import { TransactionListRowPositionEnum } from '../../transaction/enum/transaction-list-row-position.enum';

export const getCategorizeInboxRowPosition = (hasPrevious: boolean, hasNext: boolean): TransactionListRowPositionEnum => {
    if (hasPrevious && hasNext) {
        return TransactionListRowPositionEnum.MIDDLE;
    }

    if (hasPrevious) {
        return TransactionListRowPositionEnum.LAST;
    }

    return hasNext ? TransactionListRowPositionEnum.FIRST : TransactionListRowPositionEnum.SINGLE;
};
