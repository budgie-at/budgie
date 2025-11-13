import { LanguageEnum, SettingsEntityInterface, ThemeEnum } from '@budgie/contracts';

export const DEFAULT_SETTINGS = {
    id: 0,
    locale: 'en-US',
    deletedAt: null,
    hideCents: false,
    defaultAccountId: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    theme: ThemeEnum.DARK,
    defaultInstrumentId: 0,
    language: LanguageEnum.EN,
} satisfies SettingsEntityInterface
