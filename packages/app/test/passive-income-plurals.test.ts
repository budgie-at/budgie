import { Messages, setupI18n } from '@lingui/core';
import { describe, expect, it } from 'vitest';

import { messages as deMessages } from '../src/i18n/locales/de/messages';
import { messages as enMessages } from '../src/i18n/locales/en/messages';
import { messages as esMessages } from '../src/i18n/locales/es/messages';
import { messages as frMessages } from '../src/i18n/locales/fr/messages';
import { messages as ukMessages } from '../src/i18n/locales/uk/messages';

const SENTENCE_ID = 'passive-income.hero.sentence';
const SO_FAR_ID = 'passive-income.chart.so-far';

const catalogs: readonly (readonly [string, Messages])[] = [
    ['en', enMessages],
    ['de', deMessages],
    ['es', esMessages],
    ['fr', frMessages],
    ['uk', ukMessages]
];

const sentenceValues = (count: number) => ({
    count,
    amount: '$12',
    rangeCaption: 'in the last 30 days',
    rate: '5.0%',
    trend: '',
    estimates: ''
});

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

    it('uk distinguishes one, few and many', () => {
        const one = translate('uk', ukMessages, SENTENCE_ID, sentenceValues(1));
        const few = translate('uk', ukMessages, SENTENCE_ID, sentenceValues(2));
        const many = translate('uk', ukMessages, SENTENCE_ID, sentenceValues(5));

        expect(one).toContain('у 1 позиції');
        expect(few).toContain('у 2 позиціях');
        expect(many).toContain('у 5 позиціях');
    });

    it.each(catalogs)('%s so-far label embeds the period label', (locale, catalog) => {
        expect(translate(locale, catalog, SO_FAR_ID, { label: 'Nov 2026' })).toContain('Nov 2026');
    });
});
