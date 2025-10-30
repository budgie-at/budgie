import { relations } from 'drizzle-orm';

import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { AccountAssociationEnum } from '../enum/account-association.enum';
import { AccountEntityTable } from '../table/account-entity.table';

export const AccountEntityRelations = relations(AccountEntityTable, ({ many }) => ({
    [AccountAssociationEnum.TRANSACTIONS]: many(TransactionEntityTable)
}));
