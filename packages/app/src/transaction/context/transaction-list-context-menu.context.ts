import { createContext, use } from 'react';

import { isDefined } from '@rnw-community/shared';

import type { TransactionListContextMenuContextValueInterface } from '../interface/transaction-list-context-menu-context-value.interface';

export const TransactionListContextMenuContext = createContext<TransactionListContextMenuContextValueInterface | null>(null);

export const useTransactionListContextMenu = (): TransactionListContextMenuContextValueInterface => {
    const context = use(TransactionListContextMenuContext);

    if (!isDefined(context)) {
        throw new Error('useTransactionListContextMenuCalledOutsideProvider');
    }

    return context;
};
