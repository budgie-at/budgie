import { convertToMicroUnits } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Result from 'effect/Result';

import { inferCsvDecimalSeparator } from '../src/import/utils/infer-csv-decimal-separator.util';
import { parseCsvAmount } from '../src/import/utils/parse-csv-amount.util';

const validAmounts = [
    ['+12,50', 12.5],
    ['EUR\u00a01\u00a0234,56', 1234.56],
    ['1 234,56', 1234.56],
    ['1.234,56 €', 1234.56],
    ['1\u00a0234,56', 1234.56],
    ['1\u202f234,56', 1234.56],
    ["CHF 1'234.56", 1234.56],
    ['1,234.56', 1234.56],
    ['1234.56', 1234.56],
    ['1234', 1234],
    ['-12,50', -12.5],
    ['12,50-', -12.5],
    ['(€ 12,50)', -12.5],
    ['(1 234,56) EUR', -1234.56],
    ['€ (12,50)', -12.5],
    ['$-12.50', -12.5],
    ['12.50+', 12.5],
    ['1.234.567', 1234567],
    ['1,234,567', 1234567],
    ['0.000001', 0.000001],
    ['0.29', 0.29]
] as const;
const invalidAmounts = [
    '',
    'garbage',
    '12abc',
    'NaN',
    'Infinity',
    '1e3',
    '12,34,56',
    '1 23,45',
    '1.234',
    '1,234',
    '1,23.45',
    "1 234'567",
    '--12',
    '(12)-',
    '12.1234567',
    '9007199254740992',
    '-4503599627.370003',
    '12 USD EUR',
    '12 XYZ',
    '12\t345'
];

describe('strict CSV amounts', () => {
    for (const [value, expected] of validAmounts) {
        it.effect(`parses ${value}`, () =>
            Effect.sync(() => {
                const result = parseCsvAmount(value);
                expect(Result.isSuccess(result)).toBe(true);
                if (Result.isSuccess(result)) {
                    expect(convertToMicroUnits(result.success)).toBe(convertToMicroUnits(expected));
                }
            })
        );
    }
    for (const value of invalidAmounts) {
        it.effect(`rejects ${value}`, () =>
            Effect.sync(() => {
                expect(Result.isFailure(parseCsvAmount(value))).toBe(true);
            })
        );
    }
    it.effect('resolves ambiguous rows using only unambiguous column evidence', () =>
        Effect.sync(() => {
            expect(inferCsvDecimalSeparator(['1.234', '+12,50', 'broken'])).toBe(',');
            expect(parseCsvAmount('1.234', ',')).toEqual(Result.succeed(1234));
            expect(parseCsvAmount('1,234', ',')).toEqual(Result.succeed(1.234));
            expect(parseCsvAmount('1.234', '.')).toEqual(Result.succeed(1.234));
            expect(parseCsvAmount('1,234', '.')).toEqual(Result.succeed(1234));
            expect(inferCsvDecimalSeparator(['1.234', '1,234', '1234'])).toBeNull();
            expect(inferCsvDecimalSeparator(['12,50', '12.50'])).toBeNull();
        })
    );
});
