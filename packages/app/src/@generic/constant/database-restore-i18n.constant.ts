import { LanguageEnum } from '@budgie/contracts';
import { setupI18n } from '@lingui/core';

export const DATABASE_RESTORE_I18N = setupI18n({ locale: LanguageEnum.EN, messages: { [LanguageEnum.EN]: {} } });
