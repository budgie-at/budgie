import { LanguageEnum, SettingsEntityInterface, ThemeEnum } from '@budgie/contracts';

export const DEFAULT_SETTINGS = {
    id: 0,
    locale: 'en-US',
    deletedAt: null,
    showCents: true,
    defaultAccountId: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    theme: ThemeEnum.DARK,
    defaultInstrumentId: 0,
    isVibrationEnabled: true,
    language: LanguageEnum.EN,
} satisfies SettingsEntityInterface
