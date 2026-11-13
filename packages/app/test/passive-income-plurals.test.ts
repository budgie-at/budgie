import { Messages, setupI18n } from '@lingui/core';
import { describe, expect, it } from 'vitest';

import { messages as deMessages } from '../src/i18n/locales/de/messages';
import { messages as enMessages } from '../src/i18n/locales/en/messages';
import { messages as esMessages } from '../src/i18n/locales/es/messages';
import { messages as frMessages } from '../src/i18n/locales/fr/messages';
import { messages as ukMessages } from '../src/i18n/locales/uk/messages';

const SENTENCE_ID = 'passive-income.hero.sentence';
const PAYOUTS_ID = 'passive-income.payouts.summary';
const SO_FAR_ID = 'passive-income.chart.so-far';

const catalogs: readonly (readonly [string, Messages])[] = [
    ['en', enMessages],
    ['de', deMessages],
    ['es', esMessages],
    ['fr', frMessages],
    ['uk', ukMessages]
];

const sentenceValues = (count: number, trend = 'other') => ({
    count,
    amount: '$12',
    rangeCaption: 'in the last 30 days',
    rate: '5.0%',
    trend,
    change: '12%'
});

const payoutValues = (count: number) => ({ count, amount: '$12', lastPayout: 'Nov 2026' });

const translate = (locale: string, catalog: Messages, id: string, values: Record<string, unknown>) => {
    const i18n = setupI18n({ locale, messages: { [locale]: catalog } });

    return i18n._(id, values);
};

describe('passive income plural catalogs', () => {
    it.each(catalogs)('%s hero sentence renders the count and every value', (locale, catalog) => {
        const sentence = translate(locale, catalog, SENTENCE_ID, sentenceValues(3));

        expect(sentence).toContain('3');
        expect(sentence).toContain('$12');
        expect(sentence).toContain('5.0%');
    });

    it('en picks singular and plural holding', () => {
        expect(translate('en', enMessages, SENTENCE_ID, sentenceValues(1))).toContain('across 1 holding');
        expect(translate('en', enMessages, SENTENCE_ID, sentenceValues(2))).toContain('across 2 holdings');
    });

    it.each([
        [1, 'у 1 активі'],
        [2, 'у 2 активах'],
        [5, 'у 5 активах'],
        [21, 'у 21 активі'],
        [22, 'у 22 активах'],
        [25, 'у 25 активах']
    ])('uk holding plural for %d', (count, phrase) => {
        expect(translate('uk', ukMessages, SENTENCE_ID, sentenceValues(count))).toContain(phrase);
    });

    it.each([
        [1, '1 виплата'],
        [3, '3 виплати'],
        [5, '5 виплат'],
        [21, '21 виплата']
    ])('uk payouts plural for %d', (count, phrase) => {
        expect(translate('uk', ukMessages, PAYOUTS_ID, payoutValues(count))).toContain(phrase);
    });

    it.each([
        ['de', 1, '1 Auszahlung '],
        ['de', 2, '2 Auszahlungen'],
        ['es', 1, '1 pago '],
        ['es', 2, '2 pagos'],
        ['es', 1_000_000, 'pagos'],
        ['fr', 0, '0 versement '],
        ['fr', 2, '2 versements'],
        ['fr', 1_000_000, 'versements']
    ])('%s payouts plural for %d', (locale, count, phrase) => {
        const catalog = Object.fromEntries(catalogs)[locale];

        expect(translate(locale, catalog, PAYOUTS_ID, payoutValues(count))).toContain(phrase);
    });

    it.each(catalogs)('%s holdings message renders every plural category', (locale, catalog) => {
        const renders = [0, 1, 2, 5, 21, 1_000_000].map(count => translate(locale, catalog, SENTENCE_ID, sentenceValues(count)));

        renders.forEach(sentence => {
            expect(sentence).toContain('$12');
            expect(sentence).not.toContain('{');
        });
    });

    it.each(catalogs)('%s trend variants carry the change only when there is one', (locale, catalog) => {
        const up = translate(locale, catalog, SENTENCE_ID, sentenceValues(3, 'up'));
        const down = translate(locale, catalog, SENTENCE_ID, sentenceValues(3, 'down'));
        const flat = translate(locale, catalog, SENTENCE_ID, sentenceValues(3));

        expect(up).toContain('12%');
        expect(down).toContain('12%');
        expect(flat).not.toContain('12%');
    });

    it.each(catalogs)('%s so-far label embeds the period label', (locale, catalog) => {
        expect(translate(locale, catalog, SO_FAR_ID, { label: 'Nov 2026' })).toContain('Nov 2026');
    });
});
