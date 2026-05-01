import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

import type { TransactionActionsMenuCloseMenuFn } from '../interface/transaction-actions-menu-close-menu-fn.type';

export const TransactionActionsMenuContext = createContext<TransactionActionsMenuCloseMenuFn>(emptyFn);

export const useTransactionActionsMenu = (): TransactionActionsMenuCloseMenuFn => use(TransactionActionsMenuContext);
