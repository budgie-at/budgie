import { defineRelationsPart } from 'drizzle-orm';

import { AccountEntityTable } from '../../account/table/account-entity.table';
import { InstrumentEntityTable } from '../../instrument/table/instrument-entity.table';
import { SettingsAssociationEnum } from '../enum/settings-association.enum';
import { SettingsEntityTable } from '../table/settings-entity.table';

export const SettingsEntityRelations = defineRelationsPart(
    {
        AccountEntityTable,
        InstrumentEntityTable,
        SettingsEntityTable
    },
    relation => ({
        SettingsEntityTable: {
            [SettingsAssociationEnum.DEFAULT_ACCOUNT]: relation.one.AccountEntityTable({
                from: relation.SettingsEntityTable.defaultAccountId,
                to: relation.AccountEntityTable.id
            }),
            [SettingsAssociationEnum.DEFAULT_INSTRUMENT]: relation.one.InstrumentEntityTable({
                from: relation.SettingsEntityTable.defaultInstrumentId,
                to: relation.InstrumentEntityTable.id
            })
        }
    })
);
