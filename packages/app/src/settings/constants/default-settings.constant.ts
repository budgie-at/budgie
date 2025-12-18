import { LanguageEnum, SettingsEntityInterface, ThemeEnum } from '@budgie/contracts';

export const DEFAULT_SETTINGS = {
    id: 0,
    locale: 'en-US',
    deletedAt: null,
    showCents: true,
    isPinEnabled: true,
    defaultAccountId: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    theme: ThemeEnum.DARK,
    defaultInstrumentId: 0,
    isVibrationEnabled: true,
    isBiometricEnabled: false,
    language: LanguageEnum.EN,
} satisfies SettingsEntityInterface
