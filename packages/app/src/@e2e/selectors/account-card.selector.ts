/* eslint-disable lingui/no-unlocalized-strings */
export const AccountCardSelectors = {
    Card: (title: string) => `AccountCard.${title}` as const
} as const;
