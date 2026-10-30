import { TransactionListItemKindEnum } from '../enum/transaction-list-item-kind.enum';
import { TransactionListRowPositionEnum } from '../enum/transaction-list-row-position.enum';

import type { TransactionsByDaySectionInterface } from '../interface/transactions-by-day-section.interface';
import type { TransactionListItemType } from '../type/transaction-list-item.type';

const getTransactionListRowPosition = (index: number, total: number): TransactionListRowPositionEnum => {
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

export const buildTransactionListItems = (sections: TransactionsByDaySectionInterface[]) => {
    const items: TransactionListItemType[] = sections.flatMap(({ title, netAmount, transactions }) => [
        { type: TransactionListItemKindEnum.HEADER, title, netAmount, id: `header-${title}` },
        ...transactions.map((transaction, index) => ({
            type: TransactionListItemKindEnum.TRANSACTION as const,
            id: `transaction-${transaction.id}`,
            position: getTransactionListRowPosition(index, transactions.length),
            transaction
        }))
    ]);

    return {
        items,
        headerIndices: items.flatMap((item, index) => (item.type === TransactionListItemKindEnum.HEADER ? [index] : []))
    };
};
