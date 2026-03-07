/* eslint-disable lingui/no-unlocalized-strings */
export const ArchivedAccountCardSelectors = {
    Card: (title: string) => `ArchivedAccountCard.${title}` as const,
    RestoreButton: (title: string) => `ArchivedAccountCard.RestoreButton.${title}` as const,
    DeleteButton: (title: string) => `ArchivedAccountCard.DeleteButton.${title}` as const
} as const;
