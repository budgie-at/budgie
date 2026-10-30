import { TransactionListItemKindEnum } from '../enum/transaction-list-item-kind.enum';

import { getTransactionListRowPosition } from './get-transaction-list-row-position.util';

import type { TransactionsByDaySectionInterface } from '../interface/transactions-by-day-section.interface';
import type { TransactionListItemType } from '../type/transaction-list-item.type';

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
