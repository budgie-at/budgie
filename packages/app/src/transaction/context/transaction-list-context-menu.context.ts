import { ExternalSourceEnum, TransactionTypeEnum } from '@budgie/contracts';
import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

import type { TransactionListContextMenuContextValueInterface } from '../interface/transaction-list-context-menu-context-value.interface';

export const TransactionListContextMenuContext = createContext<TransactionListContextMenuContextValueInterface>({
    transaction: {
        id: 0,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        deletedAt: null,
        type: TransactionTypeEnum.EXPENSE,
        title: '',
        externalId: null,
        operatedAt: new Date(0),
        comment: '',
        toAccountId: null,
        fromAccountId: null,
        exchangeRate: 1,
        externalSource: ExternalSourceEnum.MANUAL,
        updatedBy: null,
        needsEmbedding: false,
        importFingerprint: null,
        consolidationParentTransactionId: null,
        consolidationType: null,
        operatedWeekday: 0,
        operatedMinuteOfDay: 0,
        entries: [],
        debtEvents: [],
        fromAccount: null,
        toAccount: null,
        transactionTags: []
    },
    closeMenu: emptyFn
});

export const useTransactionListContextMenu = () => use(TransactionListContextMenuContext);
