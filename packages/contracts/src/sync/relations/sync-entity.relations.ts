import { defineRelationsPart } from 'drizzle-orm';

import { AccountEntityTable } from '../../account/table/account-entity.table';
import { SyncAssociationEnum } from '../enum/sync-association.enum';
import { SyncEntityTable } from '../table/sync-entity.table';

export const SyncEntityRelations = defineRelationsPart(
    {
        AccountEntityTable,
        SyncEntityTable
    },
    relation => ({
        SyncEntityTable: {
            [SyncAssociationEnum.ACCOUNT]: relation.one.AccountEntityTable({
                from: relation.SyncEntityTable.accountId,
                to: relation.AccountEntityTable.id,
                optional: false
            })
        }
    })
);
