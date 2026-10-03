import { defineRelationsPart } from 'drizzle-orm';

import { AccountEntityTable } from '../../account/table/account-entity.table';
import { AccountBalanceAssociationEnum } from '../enum/account-balance-association.enum';
import { AccountBalanceEntityTable } from '../table/account-balance-entity.table';

export const AccountBalanceEntityRelations = defineRelationsPart(
    {
        AccountBalanceEntityTable,
        AccountEntityTable
    },
    relation => ({
        AccountBalanceEntityTable: {
            [AccountBalanceAssociationEnum.ACCOUNT]: relation.one.AccountEntityTable({
                from: relation.AccountBalanceEntityTable.accountId,
                to: relation.AccountEntityTable.id,
                optional: false
            })
        }
    })
);
