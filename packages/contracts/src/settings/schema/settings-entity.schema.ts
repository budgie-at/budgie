import { createSelectSchema } from 'drizzle-zod';
import { enum as zodEnum } from 'zod';

import { LanguageEnum } from '../../generic/enum/language.enum';
import { ThemeEnum } from '../../generic/enum/theme.enum';
import { SettingsEntityTable } from '../table/settings-entity.table';

export const SettingsEntitySchema = createSelectSchema(SettingsEntityTable, {
    theme: zodEnum(ThemeEnum).describe('Theme for the application.'),
    language: zodEnum(LanguageEnum).describe('The language for the application.'),
    locale: schema => schema.describe('The locale for the application.'),
    hideCents: schema => schema.describe('Determines whether to hide cents in the application.'),
    defaultAccountId: schema => schema.positive().describe('Id of the default account for new transactions.'),
    defaultInstrumentId: schema => schema.positive().describe('Id of the default instrument for new transactions and accounts.')
});
