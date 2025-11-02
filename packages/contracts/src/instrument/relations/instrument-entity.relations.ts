import { relations } from 'drizzle-orm';

import { AccountEntityTable } from '../../account/table/account-entity.table';
import { InstrumentAssociationEnum } from '../enum/instrument-association.enum';
import { InstrumentEntityTable } from '../table/instrument-entity.table';

export const InstrumentEntityRelations = relations(InstrumentEntityTable, ({ one }) => ({
    [InstrumentAssociationEnum.ACCOUNT]: one(AccountEntityTable, {
        fields: [InstrumentEntityTable.accountId],
        references: [AccountEntityTable.id]
    })
}));
