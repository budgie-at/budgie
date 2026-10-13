import { TransactionListItemKindEnum } from '../enum/transaction-list-item-kind.enum';

import type { TransactionCardProps } from '../components/transaction-card/transaction-card';

export type TransactionListItemType =
    | { type: TransactionListItemKindEnum.HEADER; title: string; id: string }
    | { type: TransactionListItemKindEnum.TRANSACTION; data: TransactionCardProps; id: string };
