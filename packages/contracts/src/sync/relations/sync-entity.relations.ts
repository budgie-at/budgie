import { relations } from 'drizzle-orm';

import { AccountEntityTable } from '../../account/table/account-entity.table';
import { SyncAssociationEnum } from '../enum/sync-association.enum';
import { SyncEntityTable } from '../table/sync-entity.table';

export const SyncEntityRelations = relations(SyncEntityTable, ({ one }) => ({
    [SyncAssociationEnum.ACCOUNT]: one(AccountEntityTable, {
        fields: [SyncEntityTable.accountId],
        references: [AccountEntityTable.id]
    })
}));
