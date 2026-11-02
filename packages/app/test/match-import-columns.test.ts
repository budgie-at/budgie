import { describe, expect, it } from '@effect/vitest';

import { matchImportColumns } from '../src/import/utils/match-import-columns.util';

describe('matchImportColumns', () => {
    it('matches all required columns in the sample export without a preset', () => {
        expect(
            matchImportColumns([
                'Date',
                'Account',
                'Category',
                'Amount',
                'Currency',
                'Payee and memo as exported by the bank including reference',
                'MCC'
            ])
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
        expect(matchImportColumns([account, category, date, amount, currency])).toMatchObject({
            toAccount: account,
            category,
            operatedAt: date,
            toAmount: amount,
            toCurrency: currency
        });
    });

    it('normalizes case, spaces, underscores and punctuation and preserves original headers', () => {
        expect(matchImportColumns([' TO_ACCOUNT ', 'Operated.At', 'to_amount', 'TO-CURRENCY', 'External_ID', 'DeScription'])).toMatchObject(
            {
                toAccount: ' TO_ACCOUNT ',
                operatedAt: 'Operated.At',
                toAmount: 'to_amount',
                toCurrency: 'TO-CURRENCY',
                externalId: 'External_ID',
                comment: 'DeScription'
            }
        );
    });

    it('keeps source and destination fields distinct and never reuses a header', () => {
        const result = matchImportColumns(['account', 'from account', 'amount', 'from amount', 'currency', 'from currency', 'mcc']);
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
        expect(matchImportColumns(['Unknown', 'Amount', 'To amount'])).toMatchObject({ toAccount: '', toAmount: 'Amount', comment: '' });
        expect(Object.values(matchImportColumns([])).every(value => value === '')).toBe(true);
    });
});
