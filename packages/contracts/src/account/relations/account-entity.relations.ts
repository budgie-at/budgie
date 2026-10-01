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
    relation => ({
        AccountEntityTable: {
            [AccountAssociationEnum.BALANCES]: relation.many.AccountBalanceEntityTable({
                from: relation.AccountEntityTable.id,
                to: relation.AccountBalanceEntityTable.accountId
            }),
            [AccountAssociationEnum.DEBT_EVENTS]: relation.many.DebtEventEntityTable({
                from: relation.AccountEntityTable.id,
                to: relation.DebtEventEntityTable.debtAccountId
            }),
            [AccountAssociationEnum.SUB_ACCOUNTS]: relation.many.AccountEntityTable({
                from: relation.AccountEntityTable.id,
                to: relation.AccountEntityTable.parentId
            }),
            [AccountAssociationEnum.PARENT]: relation.one.AccountEntityTable({
                from: relation.AccountEntityTable.parentId,
                to: relation.AccountEntityTable.id
            }),
            [AccountAssociationEnum.INSTRUMENT]: relation.one.InstrumentEntityTable({
                from: relation.AccountEntityTable.instrumentId,
                to: relation.InstrumentEntityTable.id,
                optional: false
            }),
            [AccountAssociationEnum.SYNC]: relation.one.SyncEntityTable({
                from: relation.AccountEntityTable.id,
                to: relation.SyncEntityTable.accountId
            }),
            [AccountAssociationEnum.INTEGRATION]: relation.one.BankIntegrationEntityTable({
                from: relation.AccountEntityTable.integrationId,
                to: relation.BankIntegrationEntityTable.id
            })
        }
    })
);
