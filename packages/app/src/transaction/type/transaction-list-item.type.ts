import { TransactionListItemKindEnum } from '../enum/transaction-list-item-kind.enum';
import { TransactionListRowPositionEnum } from '../enum/transaction-list-row-position.enum';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export type TransactionListItemType =
    | { type: TransactionListItemKindEnum.HEADER; title: string; id: string }
    | {
          type: TransactionListItemKindEnum.TRANSACTION;
          transaction: TransactionWithRelationsEntityInterface;
          position: TransactionListRowPositionEnum;
          id: string;
      };
