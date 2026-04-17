const normalizePart = (value: string | number) => value.toString().replace(/[^a-zA-Z0-9]+/gu, '_');

export const HomePageSelector = {
    TotalBalance: 'HomePage.TotalBalance',
    NetWorthValue: (value: string | number) => `HomePage.NetWorthValue.${normalizePart(value)}` as const
} as const;
