import { defineRelationsPart } from 'drizzle-orm';

import { AccountEntityTable } from '../../account/table/account-entity.table';
import { BankIntegrationAssociationEnum } from '../enum/bank-integration-association.enum';
import { BankIntegrationEntityTable } from '../table/bank-integration-entity.table';

export const BankIntegrationEntityRelations = defineRelationsPart(
    {
        AccountEntityTable,
        BankIntegrationEntityTable
    },
    relation => ({
        BankIntegrationEntityTable: {
            [BankIntegrationAssociationEnum.ACCOUNTS]: relation.many.AccountEntityTable({
                from: relation.BankIntegrationEntityTable.id,
                to: relation.AccountEntityTable.integrationId
            })
        }
    })
);
