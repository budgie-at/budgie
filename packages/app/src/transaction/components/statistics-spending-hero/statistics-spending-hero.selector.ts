export const StatisticsSpendingHeroSelector = {
    Spent: (amount: number) => `StatisticsSpendingHero.Spent.${String(amount).replaceAll(/[^a-zA-Z0-9]+/gu, '_')}` as const
} as const;
