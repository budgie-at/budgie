import { TransactionListItemKindEnum } from '../enum/transaction-list-item-kind.enum';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export type TransactionListItemType =
    | { type: TransactionListItemKindEnum.HEADER; title: string; id: string }
    | { type: TransactionListItemKindEnum.TRANSACTION; transaction: TransactionWithRelationsEntityInterface; id: string };
