const normalizePart = (value: string | number) => String(value).replace(/[^a-zA-Z0-9]+/gu, '_');

export const DebtAccountCardFooterSelector = {
    Percentage: (title: string, percentage: number) =>
        `DebtAccountCardFooter.Percentage.${normalizePart(title)}.${normalizePart(percentage)}` as const
} as const;
