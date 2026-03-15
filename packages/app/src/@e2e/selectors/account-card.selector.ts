 
const normalizePart = (value: string | number) => String(value).replace(/[^a-zA-Z0-9]+/gu, '_');

export const AccountCardSelectors = {
    Card: (title: string) => `AccountCard.${title}` as const,
    Balance: (title: string, value: string | number) => `AccountCard.Balance.${normalizePart(title)}.${normalizePart(value)}` as const
} as const;
