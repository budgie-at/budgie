import { relations } from 'drizzle-orm';

import { AccountEntityTable } from '../../account/table/account-entity.table';
import { InstrumentEntityTable } from '../../instrument/table/instrument-entity.table';
import { SettingsAssociationEnum } from '../enum/settings-association.enum';
import { SettingsEntityTable } from '../table/settings-entity.table';

export const SettingsEntityRelations = relations(SettingsEntityTable, ({ one }) => ({
    [SettingsAssociationEnum.DEFAULT_ACCOUNT]: one(AccountEntityTable, {
        fields: [SettingsEntityTable.defaultAccountId],
        references: [AccountEntityTable.id]
    }),
    [SettingsAssociationEnum.DEFAULT_INSTRUMENT]: one(InstrumentEntityTable, {
        fields: [SettingsEntityTable.defaultInstrumentId],
        references: [InstrumentEntityTable.id]
    }),
}))
