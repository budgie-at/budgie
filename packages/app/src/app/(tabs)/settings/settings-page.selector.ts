const normalizePart = (value: string) => value.replace(/[^a-zA-Z0-9]+/gu, '_');

export const SettingsPageSelector = {
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
    InactiveCard: 'SettingsPage.InactiveCard',
    ImportDatabaseCard: 'SettingsPage.ImportDatabaseCard',
    ExportDatabaseCard: 'SettingsPage.ExportDatabaseCard',
    ClearDataCard: 'SettingsPage.ClearDataCard'
} as const;
