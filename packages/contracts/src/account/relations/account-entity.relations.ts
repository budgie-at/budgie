import { relations } from 'drizzle-orm';

import { AccountBalanceEntityTable } from '../../account-balance/table/account-balance-entity.table';
import { BankIntegrationEntityTable } from '../../bank-integration/table/bank-integration-entity.table';
import { DebtEventEntityTable } from '../../debt-event/table/debt-event-entity.table';
import { InstrumentEntityTable } from '../../instrument/table/instrument-entity.table';
import { SyncEntityTable } from '../../sync/table/sync-entity.table';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { AccountAssociationEnum } from '../enum/account-association.enum';
import { AccountEntityTable } from '../table/account-entity.table';

export const AccountEntityRelations = relations(AccountEntityTable, ({ many, one }) => ({
    [AccountAssociationEnum.TRANSACTIONS]: many(TransactionEntityTable),
    [AccountAssociationEnum.BALANCES]: many(AccountBalanceEntityTable),
    [AccountAssociationEnum.DEBT_EVENTS]: many(DebtEventEntityTable),
    [AccountAssociationEnum.SUB_ACCOUNTS]: many(AccountEntityTable),
    [AccountAssociationEnum.PARENT]: one(AccountEntityTable, {
        fields: [AccountEntityTable.parentId],
        references: [AccountEntityTable.id]
    }),
    [AccountAssociationEnum.INSTRUMENT]: one(InstrumentEntityTable, {
        fields: [AccountEntityTable.instrumentId],
        references: [InstrumentEntityTable.id]
    }),
    [AccountAssociationEnum.SYNC]: one(SyncEntityTable, {
        fields: [AccountEntityTable.id],
        references: [SyncEntityTable.accountId]
    }),
    [AccountAssociationEnum.INTEGRATION]: one(BankIntegrationEntityTable, {
        fields: [AccountEntityTable.integrationId],
        references: [BankIntegrationEntityTable.id]
    })
}));
