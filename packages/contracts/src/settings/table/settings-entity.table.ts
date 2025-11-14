import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { AccountEntityTable } from '../../account/table/account-entity.table';
import { LanguageEnum } from '../../generic/enum/language.enum';
import { ThemeEnum } from '../../generic/enum/theme.enum';
import { convertEnumToDrizzleEnum } from '../../generic/util/convert-enum-to-drizzle-enum.util';
import { withBaseEntityTableColumns } from '../../generic/util/with-base-entity-table-columns.util';
import { InstrumentEntityTable } from '../../instrument/table/instrument-entity.table';

export const SettingsEntityTable = sqliteTable(
    'settings',
    withBaseEntityTableColumns({
        locale: text('locale').notNull(),
        language: text('language', { enum: convertEnumToDrizzleEnum(LanguageEnum) })
            .notNull()
            .default(LanguageEnum.EN)
            .$type<LanguageEnum>(),
        defaultAccountId: int('default_account_id', { mode: 'number' }).references(() => AccountEntityTable.id),
        defaultInstrumentId: int('default_instrument_id', { mode: 'number' }).references(() => InstrumentEntityTable.id),
        theme: text('theme', { enum: convertEnumToDrizzleEnum(ThemeEnum) })
            .notNull()
            .default(ThemeEnum.SYSTEM)
            .$type<ThemeEnum>(),
        showCents: int('show_cents', { mode: 'boolean' }).notNull().default(true),
        isVibrationEnabled: int('is_vibration_enabled', { mode: 'boolean' }).notNull().default(true)
    })
);
