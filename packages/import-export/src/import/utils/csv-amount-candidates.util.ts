import { CurrencyEnum, convertToMicroUnits } from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import type { CsvAmountCandidateInterface } from '../interface/csv-amount-candidate.interface';

export const csvAmountCandidates = (value: string): CsvAmountCandidateInterface[] => {
    const trimmed = value.trim().replaceAll(/[\u00a0\u202f]/gu, ' ');
    const currencies = trimmed.match(/\p{Sc}|[A-Za-z]+/gu) ?? [];
    const withoutCurrency = trimmed.replaceAll(/^[\p{Sc}A-Za-z ]+|[\p{Sc}A-Za-z ]+$/gu, '').trim();
    const negative = withoutCurrency.startsWith('(') && withoutCurrency.endsWith(')');
    const unsigned = negative ? withoutCurrency.slice(1, -1).trim() : withoutCurrency;
    const signs = unsigned.match(/[+-]/gu) ?? [];
    const number = unsigned.replaceAll(/^[+\-\p{Sc}A-Za-z ]+|[+\-\p{Sc}A-Za-z ]+$/gu, '').trim();
    const validCurrency = currencies.every(
        currency => /^\p{Sc}$/u.test(currency) || Object.values<string>(CurrencyEnum).includes(currency)
    );

    if (!validCurrency || currencies.length > 1 || signs.length > 1 || (negative && isNotEmptyArray(signs))) {
        return [];
    }

    return ([null, '.', ','] as const).flatMap(decimalSeparator => {
        const parts = isDefined(decimalSeparator) ? number.split(decimalSeparator) : [number];
        const integer = parts[0] ?? '';
        const fraction = parts[1] ?? '';
        const grouping = integer.match(/[^0-9]/u)?.[0];
        const groups = isDefined(grouping) ? integer.split(grouping) : [integer];
        const validGroups =
            /^[0-9]+$/u.test(integer) ||
            (isDefined(grouping) &&
                /^[ .,\u00a0\u202f']$/u.test(grouping) &&
                /^[0-9]{1,3}$/u.test(groups[0] ?? '') &&
                groups.slice(1).every(group => /^[0-9]{3}$/u.test(group)));

        if (!validGroups || !(isDefined(decimalSeparator) ? parts.length === 2 && /^[0-9]{1,6}$/u.test(fraction) : parts.length === 1)) {
            return [];
        }

        const amount = Number(`${groups.join('')}.${fraction || '0'}`) * (negative || signs[0] === '-' ? -1 : 1);
        const expectedMicroUnits = BigInt(groups.join('')) * BigInt(convertToMicroUnits(1)) + BigInt(fraction.padEnd(6, '0'));
        const microUnits = convertToMicroUnits(Math.abs(amount));

        return Number.isSafeInteger(microUnits) &&
            Math.abs(convertToMicroUnits(amount)) === microUnits &&
            BigInt(microUnits) === expectedMicroUnits
            ? [{ amount, decimalSeparator }]
            : [];
    });
};
