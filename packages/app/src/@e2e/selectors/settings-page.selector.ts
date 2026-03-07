const normalizePart = (value: string) => value.replace(/[^a-zA-Z0-9]+/g, '_');

/* eslint-disable lingui/no-unlocalized-strings */
export const SettingsPageSelectors = {
    Container: 'SettingsPage.Container',
    LanguageCard: 'SettingsPage.LanguageCard',
    LanguageValue: (code: string) => `SettingsPage.LanguageValue.${normalizePart(code)}` as const,
    MainCurrencyCard: 'SettingsPage.MainCurrencyCard',
    MainCurrencyValue: (code: string) => `SettingsPage.MainCurrencyValue.${normalizePart(code)}` as const,
    DefaultAccountCard: 'SettingsPage.DefaultAccountCard',
    DefaultAccountValue: (title: string) => `SettingsPage.DefaultAccountValue.${normalizePart(title)}` as const,
    ManageCategoriesCard: 'SettingsPage.ManageCategoriesCard',
    ManageTagsCard: 'SettingsPage.ManageTagsCard',
    ArchivedCard: 'SettingsPage.ArchivedCard',
    InactiveCard: 'SettingsPage.InactiveCard'
} as const;
