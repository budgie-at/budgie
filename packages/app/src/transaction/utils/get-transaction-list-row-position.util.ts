import { TransactionListRowPositionEnum } from '../enum/transaction-list-row-position.enum';

export const getTransactionListRowPosition = (index: number, total: number): TransactionListRowPositionEnum => {
    const isFirst = index === 0;
    const isLast = index === total - 1;

    if (isFirst && isLast) {
        return TransactionListRowPositionEnum.SINGLE;
    }

    if (isFirst) {
        return TransactionListRowPositionEnum.FIRST;
    }

    return isLast ? TransactionListRowPositionEnum.LAST : TransactionListRowPositionEnum.MIDDLE;
};
