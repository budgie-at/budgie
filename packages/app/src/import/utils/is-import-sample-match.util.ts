import { CurrencyEnum } from '@budgie/contracts';

import type { ImportColumnMapFormValues } from '@budgie/import-export';

export const isImportSampleMatch = (field: keyof ImportColumnMapFormValues, sample: string): boolean => {
    const value = sample.trim();

    if (field === 'toCurrency') {
        return Object.values(CurrencyEnum).some((currency: string) => currency === value);
    }

    if (field === 'toAmount') {
        return /^[+-]?\s*\p{Sc}?\s*(?:\d+|\d{1,3}(?:[\s,.]\d{3})+)(?:[.,]\d+)?\s*\p{Sc}?$/u.test(value);
    }

    if (field === 'operatedAt') {
        const isoDate = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
        const localDate = /^(\d{2})([./])(\d{2})\2(\d{4})$/u.exec(value);
        const year = Number(isoDate?.[1] ?? localDate?.[4]);
        const firstPart = Number(localDate?.[1]);
        const secondPart = Number(localDate?.[3]);
        const isMonthFirst = localDate?.[2] === '/' && secondPart > 12;
        const month = Number(isoDate?.[2] ?? (isMonthFirst ? firstPart : secondPart));
        const day = Number(isoDate?.[3] ?? (isMonthFirst ? secondPart : firstPart));
        const date = new Date(Date.UTC(year, month - 1, day));

        return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
    }

    return false;
};
