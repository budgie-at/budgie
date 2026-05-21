import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { LanguageEnum } from '../../@generic/enum/language.enum';
import { ThemeEnum } from '../../@generic/enum/theme.enum';
import { convertEnumToDrizzleEnum } from '../../@generic/util/convert-enum-to-drizzle-enum.util';
import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { InstrumentEntityTable } from '../../instrument/table/instrument-entity.table';

export const SettingsEntityTable = sqliteTable(
    'settings',
    withBaseEntityTableColumns({
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
        isPinEnabled: int('is_pin_enabled', { mode: 'boolean' }).notNull().default(false),
        isBiometricEnabled: int('is_biometric_enabled', { mode: 'boolean' }).notNull().default(false),
        showCents: int('show_cents', { mode: 'boolean' }).notNull().default(true),
        isVibrationEnabled: int('is_vibration_enabled', { mode: 'boolean' }).notNull().default(true),
        isScreenshotProtectionEnabled: int('is_screenshot_protection_enabled', { mode: 'boolean' }).notNull().default(false),
        applyMccDefaultCategory: int('apply_mcc_default_category', { mode: 'boolean' }).notNull().default(true)
    })
);
