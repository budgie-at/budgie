import { createSelectSchema } from 'drizzle-zod';
import { enum as zodEnum } from 'zod';

import { LanguageEnum } from '../../generic/enum/language.enum';
import { ThemeEnum } from '../../generic/enum/theme.enum';
import { SettingsEntityTable } from '../table/settings-entity.table';

export const SettingsEntitySchema = createSelectSchema(SettingsEntityTable, {
    theme: zodEnum(ThemeEnum).describe('Theme for the application.'),
    language: zodEnum(LanguageEnum).describe('The language for the application.'),
    locale: schema => schema.describe('The locale for the application.'),
    showCents: schema => schema.describe('Determines whether to show cents in the application.'),
    isVibrationEnabled: schema => schema.describe('Determines whether vibration is enabled in the application.'),
    defaultAccountId: schema => schema.positive().nullable().describe('Id of the default account for new transactions.'),
    defaultInstrumentId: schema => schema.positive().nullable().describe('Id of the default instrument for new transactions and accounts.')
});
