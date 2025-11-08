import { relations } from 'drizzle-orm';

import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';
import { TransactionEntityTable } from '../table/transaction-entity.table';

export const TransactionEntityRelations = relations(TransactionEntityTable, ({ many }) => ({
    [TransactionAssociationEnum.ENTRIES]: many(TransactionEntryEntityTable)
}));
