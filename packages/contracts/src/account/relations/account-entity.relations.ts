import { relations } from 'drizzle-orm';

import { AccountBalanceEntityTable } from '../../account-balance/table/account-balance-entity.table';
import { BankSyncEntityTable } from '../../bank-sync/table/bank-sync-entity.table';
import { InstrumentEntityTable } from '../../instrument/table/instrument-entity.table';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { AccountAssociationEnum } from '../enum/account-association.enum';
import { AccountEntityTable } from '../table/account-entity.table';

export const AccountEntityRelations = relations(AccountEntityTable, ({ many, one }) => ({
    [AccountAssociationEnum.TRANSACTIONS]: many(TransactionEntityTable),
    [AccountAssociationEnum.BALANCES]: many(AccountBalanceEntityTable),
    [AccountAssociationEnum.SUB_ACCOUNTS]: many(AccountEntityTable),
    [AccountAssociationEnum.PARENT]: one(AccountEntityTable, {
        fields: [AccountEntityTable.parentId],
        references: [AccountEntityTable.id]
    }),
    [AccountAssociationEnum.INSTRUMENT]: one(InstrumentEntityTable, {
        fields: [AccountEntityTable.instrumentId],
        references: [InstrumentEntityTable.id]
    }),
    [AccountAssociationEnum.BANK_SYNC]: one(BankSyncEntityTable, {
        fields: [AccountEntityTable.id],
        references: [BankSyncEntityTable.accountId]
    })
}));
