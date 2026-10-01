import { defineRelationsPart } from 'drizzle-orm';

import { AccountBalanceEntityTable } from '../../account-balance/table/account-balance-entity.table';
import { BankIntegrationEntityTable } from '../../bank-integration/table/bank-integration-entity.table';
import { DebtEventEntityTable } from '../../debt-event/table/debt-event-entity.table';
import { InstrumentEntityTable } from '../../instrument/table/instrument-entity.table';
import { SyncEntityTable } from '../../sync/table/sync-entity.table';
import { AccountAssociationEnum } from '../enum/account-association.enum';
import { AccountEntityTable } from '../table/account-entity.table';

export const AccountEntityRelations = defineRelationsPart(
    {
        AccountEntityTable,
        AccountBalanceEntityTable,
        BankIntegrationEntityTable,
        DebtEventEntityTable,
        InstrumentEntityTable,
        SyncEntityTable
    },
    r => ({
        AccountEntityTable: {
            [AccountAssociationEnum.BALANCES]: r.many.AccountBalanceEntityTable({
                from: r.AccountEntityTable.id,
                to: r.AccountBalanceEntityTable.accountId
            }),
            [AccountAssociationEnum.DEBT_EVENTS]: r.many.DebtEventEntityTable({
                from: r.AccountEntityTable.id,
                to: r.DebtEventEntityTable.debtAccountId
            }),
            [AccountAssociationEnum.SUB_ACCOUNTS]: r.many.AccountEntityTable({
                from: r.AccountEntityTable.id,
                to: r.AccountEntityTable.parentId
            }),
            [AccountAssociationEnum.PARENT]: r.one.AccountEntityTable({
                from: r.AccountEntityTable.parentId,
                to: r.AccountEntityTable.id
            }),
            [AccountAssociationEnum.INSTRUMENT]: r.one.InstrumentEntityTable({
                from: r.AccountEntityTable.instrumentId,
                to: r.InstrumentEntityTable.id,
                optional: false
            }),
            [AccountAssociationEnum.SYNC]: r.one.SyncEntityTable({
                from: r.AccountEntityTable.id,
                to: r.SyncEntityTable.accountId
            }),
            [AccountAssociationEnum.INTEGRATION]: r.one.BankIntegrationEntityTable({
                from: r.AccountEntityTable.integrationId,
                to: r.BankIntegrationEntityTable.id
            })
        }
    })
);
