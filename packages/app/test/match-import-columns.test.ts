import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { parseCsvSample } from '../../import-export/src/import/utils/csv-parser.util';
import { isImportColumnNameInformative } from '../src/import/utils/is-import-column-name-informative.util';
import { matchImportColumns } from '../src/import/utils/match-import-columns.util';

describe('matchImportColumns', () => {
    it('matches all required columns in the sample export without a preset', () => {
        expect(
            matchImportColumns(
                ['Date', 'Account', 'Category', 'Amount', 'Currency', 'Payee and memo as exported by the bank including reference', 'MCC'],
                { Date: ['2026-11-02'], Amount: ['12.50'] }
            )
        ).toMatchObject({
            toAccount: 'Account',
            category: 'Category',
            operatedAt: 'Date',
            toAmount: 'Amount',
            toCurrency: 'Currency',
            mcc: 'MCC'
        });
    });

    it.each([
        ['Konto', 'Kategorie', 'Buchungsdatum', 'Betrag', 'Währung'],
        ['Cuenta', 'Categoría', 'Fecha', 'Importe', 'Moneda'],
        ['Compte', 'Catégorie', 'Date opération', 'Montant', 'Devise'],
        ['Рахунок', 'Категорія', 'Дата операції', 'Сума', 'Валюта']
    ])('matches translated required columns for %s', (account, category, date, amount, currency) => {
        expect(
            matchImportColumns([account, category, date, amount, currency], { [date]: ['2026-11-02'], [amount]: ['12.50'] })
        ).toMatchObject({
            toAccount: account,
            category,
            operatedAt: date,
            toAmount: amount,
            toCurrency: currency
        });
    });

    it('normalizes case, spaces, underscores and punctuation and preserves original headers', () => {
        expect(
            matchImportColumns([' TO_ACCOUNT ', 'Operated.At', 'to_amount', 'TO-CURRENCY', 'External_ID', 'DeScription'], {
                'Operated.At': ['2026-11-02'],
                to_amount: ['12.50']
            })
        ).toMatchObject({
            toAccount: ' TO_ACCOUNT ',
            operatedAt: 'Operated.At',
            toAmount: 'to_amount',
            toCurrency: 'TO-CURRENCY',
            externalId: 'External_ID',
            comment: 'DeScription'
        });
    });

    it('keeps source and destination fields distinct and never reuses a header', () => {
        const result = matchImportColumns(['account', 'from account', 'amount', 'from amount', 'currency', 'from currency', 'mcc'], {
            amount: ['12.50'],
            'from amount': ['12.50']
        });
        const matchedHeaders = Object.values(result).filter(Boolean);
        expect(result).toMatchObject({
            toAccount: 'account',
            fromAccount: 'from account',
            toAmount: 'amount',
            fromAmount: 'from amount',
            toCurrency: 'currency',
            fromCurrency: 'from currency',
            mcc: 'mcc'
        });
        expect(new Set(matchedHeaders).size).toBe(matchedHeaders.length);
    });

    it('leaves unknown columns unmatched and chooses the first matching header', () => {
        expect(matchImportColumns(['Unknown', 'Amount', 'To amount'], { Amount: ['12.50'], 'To amount': ['20'] })).toMatchObject({
            toAccount: '',
            toAmount: 'Amount',
            comment: ''
        });
        expect(Object.values(matchImportColumns([])).every(value => value === '')).toBe(true);
    });
});

describe('matchImportColumns sample inference', () => {
    it.effect('rejects an amount column with an unsafe value after row 20', () =>
        Effect.gen(function* () {
            const samples = yield* parseCsvSample(['Amount', ...Array.from({ length: 24 }, () => ' 12.50 '), '"1,234.56"'].join('\n'));

            expect(matchImportColumns(['Amount'], samples).toAmount).toBe('');
            expect(samples['Amount']).toHaveLength(25);
            expect(samples['Amount'][0]).toBe('12.50');
        })
    );

    it.effect('rejects a date column with an unsupported value after row 20', () =>
        Effect.gen(function* () {
            const samples = yield* parseCsvSample(['Date', ...Array.from({ length: 24 }, () => '2026-11-02'), '25.11.2026'].join('\n'));

            expect(matchImportColumns(['Date'], samples).operatedAt).toBe('');
            expect(samples['Date']).toHaveLength(25);
            expect(samples['Date'][0]).toBe('2026-11-02');
        })
    );

    it.each(['Betrag', 'Amount', 'fromAmount', 'Quellbetrag'])('rejects unsafe name-matched amount values for %s', header => {
        expect(matchImportColumns([header], { [header]: ['1.234,56', '12,50'] })).toMatchObject({ toAmount: '', fromAmount: '' });
    });

    it('accepts every safe value in a name-matched amount column', () => {
        expect(matchImportColumns(['Amount'], { Amount: ['-42.10', '3200'] }).toAmount).toBe('Amount');
    });

    it.each(['Amount', 'Value'])('rejects mixed safe and unsafe amounts in %s', header => {
        expect(matchImportColumns([header], { [header]: ['12.50', '1.234,56'] }).toAmount).toBe('');
    });

    it.each(['Amount', 'fromAmount'])('rejects name-matched amount columns with no values in %s', header => {
        expect(matchImportColumns([header], { [header]: [] })).toMatchObject({ toAmount: '', fromAmount: '' });
        expect(matchImportColumns([header])).toMatchObject({ toAmount: '', fromAmount: '' });
    });

    it.each(['Date', 'Datum', 'When'])('requires every date in %s to use an importer format', header => {
        expect(matchImportColumns([header], { [header]: ['02.11.2026'] }).operatedAt).toBe('');
        expect(matchImportColumns([header], { [header]: ['2026-11-02'] }).operatedAt).toBe(header);
        expect(matchImportColumns([header], { [header]: ['2026-11-02', '02.11.2026'] }).operatedAt).toBe('');
        expect(matchImportColumns([header], { [header]: [] }).operatedAt).toBe('');
    });

    it('leaves rejected name matches available to other field kinds', () => {
        expect(matchImportColumns(['Amount'], { Amount: ['2026-11-02'] })).toMatchObject({ toAmount: '', operatedAt: 'Amount' });
    });

    it.each(['2026-11-02', '11/25/2026 14:30:00'])('infers dates from %s', sample => {
        expect(matchImportColumns(['When'], { When: [sample] }).operatedAt).toBe('When');
    });

    it.each(['-42.10', '3200', '5.4', '+12.50', '  -12.50  '])('infers amounts from %s', sample => {
        expect(matchImportColumns(['Value'], { Value: [sample] }).toAmount).toBe('Value');
    });

    it.each(['+12,50', '1 234,56', '1\u00a0234,56', '1.234,56 €', '$1,234.56'])('does not infer unsafe amount %s', sample => {
        expect(matchImportColumns(['Value'], { Value: [sample] }).toAmount).toBe('');
    });

    it.each(['02.11.2026', '02/11/2026', '11/25/2026', '2026-02-30', '11/25/2026 25:00:00'])(
        'does not infer unsupported date %s',
        sample => {
            expect(matchImportColumns(['When'], { When: [sample] }).operatedAt).toBe('');
        }
    );

    it('infers ISO currencies and leaves account/category untouched', () => {
        expect(matchImportColumns(['Unit', 'When', 'Value'], { Unit: ['EUR'], When: ['2026-11-02'], Value: ['-42.50'] })).toMatchObject({
            toCurrency: 'Unit',
            operatedAt: 'When',
            toAmount: 'Value',
            toAccount: '',
            category: ''
        });
    });

    it('keeps name matches and never reuses already mapped headers', () => {
        expect(
            matchImportColumns(['Comment', 'Amount', 'Other', 'Unit'], {
                Comment: ['2026-11-02'],
                Amount: ['-10.00'],
                Other: ['-20.00'],
                Unit: ['USD']
            })
        ).toMatchObject({ comment: 'Comment', operatedAt: '', toAmount: 'Amount', toCurrency: 'Unit' });
    });

    it('does not use named optional columns as required sample matches', () => {
        expect(matchImportColumns(['MCC', 'From currency'], { MCC: ['1234'], 'From currency': ['USD'] })).toMatchObject({
            mcc: 'MCC',
            fromCurrency: 'From currency',
            toAmount: '',
            toCurrency: ''
        });
    });

    it('chooses the first unused sample match', () => {
        expect(matchImportColumns(['First', 'Second'], { First: ['-10.00'], Second: ['-20.00'] }).toAmount).toBe('First');
    });

    it.each(['XYZ', 'eur', 'EURO', '', '31.02.2026', '2026-13-01', '12/32/2026', 'not a value'])('rejects invalid samples %s', sample => {
        expect(Object.values(matchImportColumns(['Unknown'], { Unknown: [sample] })).every(value => value === '')).toBe(true);
    });
});

describe('informative mapped column names', () => {
    it.each([
        ['Account', 'To account'],
        ['Currency', 'To currency'],
        ['Date', 'Date'],
        [' AMOUNT ', 'Amount'],
        ['To_account', 'To account'],
        ['Category', 'Category'],
        ['WÄHRUNG', 'Zu Währung'],
        ['日付', '日付']
    ])('hides redundant header %s for %s', (header, label) => {
        expect(isImportColumnNameInformative(header, label)).toBe(false);
    });

    it.each([
        ['Col A', 'To account'],
        ['operatedAt', 'Date'],
        ['Account', 'Category'],
        ['From amount', 'Amount']
    ])('keeps informative header %s for %s', (header, label) => {
        expect(isImportColumnNameInformative(header, label)).toBe(true);
    });
});
