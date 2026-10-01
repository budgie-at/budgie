const normalizePart = (value: string | number) => String(value).replace(/[^a-zA-Z0-9]+/gu, '_');

export const DebtAccountCardRingSelector = {
    Percentage: (title: string, percentage: number) =>
        `DebtAccountCardRing.Percentage.${normalizePart(title)}.${normalizePart(percentage)}` as const
} as const;
