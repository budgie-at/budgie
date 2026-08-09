export const BankProviderSectionHeaderSelector = {
    SettingsButton: (integrationId: number) => `BankProviderSectionHeader.SettingsButton.${integrationId}` as const
} as const;
