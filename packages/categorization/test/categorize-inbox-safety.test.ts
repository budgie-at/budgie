import { categorizeInboxEngineService, CategorizeInboxLabelKindEnum, CategorizeInboxSectionEnum } from '@budgie/categorization';
import { TransactionTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';

import type { CategorizeInboxRowInterface, LabelEvidenceRowInterface } from '@budgie/categorization';

const now = new Date('2026-11-07T12:00:00Z');
const row: CategorizeInboxRowInterface = {
    transactionId: 1,
    type: TransactionTypeEnum.EXPENSE,
    title: 'Example Merchant',
    operatedAt: now,
    amount: 1000,
    baseAmount: null,
    baseInstrumentId: null,
    instrumentSymbol: 'EUR',
    mccCategoryId: 1,
    categoryId: null,
    tagIds: [],
    mcc: '5411',
    toIban: null
};
const evidence: LabelEvidenceRowInterface = {
    title: 'Other Shop',
    type: TransactionTypeEnum.EXPENSE,
    mccCategoryId: 1,
    labelId: 7,
    count: 3
};
const clusters = (rows: CategorizeInboxRowInterface[], history = [evidence]) =>
    categorizeInboxEngineService.buildClusters(
        rows,
        categorizeInboxEngineService.buildContext(history, 1, CategorizeInboxLabelKindEnum.CATEGORY),
        now
    );

describe('categorization/inbox-safety', () => {
    it.each(['4829', '6010', '6011', '6012', '6051', '6538', '6540', '5999', '8999', '7299', '7399'])('rejects catch-all MCC %s', mcc => {
        expect(clusters([{ ...row, mcc }])[0].candidateLabelIds).toEqual([]);
    });
    it('preserves recent keys and prefixes only older keys', () => {
        expect(clusters([row])[0].key).toBe('EXPENSE|example merchant|5411|');
        expect(clusters([{ ...row, operatedAt: new Date('2024-01-01') }])[0].key).toBe('OLDER|EXPENSE|example merchant|5411|');
    });
    it('falls back to strong MCC evidence after weak brand evidence', () => {
        expect(
            clusters([row], [{ ...evidence, title: 'Example Cafe', mccCategoryId: 2, labelId: 8, count: 2 }, evidence])[0].candidateLabelIds
        ).toEqual([7]);
    });
    it('requires three supporting decisions and a clear fallback majority', () => {
        expect(clusters([row], [{ ...evidence, count: 2 }])[0].candidateLabelIds).toEqual([]);
        expect(clusters([row], [evidence, { ...evidence, labelId: 8, count: 2 }])[0].candidateLabelIds).toEqual([]);
        expect(clusters([row])[0].candidateLabelIds).toEqual([7]);
    });
    it('applies the support threshold to brand fallback', () => {
        expect(clusters([row], [{ ...evidence, title: 'Example Cafe', count: 2 }])[0].candidateLabelIds).toEqual([]);
        expect(clusters([row], [{ ...evidence, title: 'Example Cafe' }])[0].candidateLabelIds).toEqual([7]);
    });
    it.each([
        'Переказ на картку *1234',
        'Transfer to card 4149****1234',
        'Переказ на картку',
        'На картку',
        'Card transfer',
        'Überweisung',
        'Virement',
        'Transferencia'
    ])('never trusts generic transfer title %s', title => {
        const [cluster] = clusters([{ ...row, title }], [{ ...evidence, title }]);
        expect(cluster.section).not.toBe(CategorizeInboxSectionEnum.CONFIDENT);
        expect(cluster.candidateLabelIds).toEqual([]);
    });
    it('preserves merchant history and separates counterparties by IBAN', () => {
        expect(clusters([row], [{ ...evidence, title: row.title }])[0].section).toBe(CategorizeInboxSectionEnum.CONFIDENT);
        expect(
            clusters([
                { ...row, toIban: 'fixture-a' },
                { ...row, transactionId: 2, toIban: 'fixture-b' }
            ])
        ).toHaveLength(2);
    });
    it('splits old rows from recent history and places them after one-offs', () => {
        const result = clusters([
            { ...row, operatedAt: new Date('2025-11-07T11:59:59Z') },
            { ...row, transactionId: 2 }
        ]);
        expect(result.map(cluster => cluster.section)).toEqual([CategorizeInboxSectionEnum.ONE_OFFS, CategorizeInboxSectionEnum.OLDER]);
        expect(clusters([{ ...row, operatedAt: new Date('2025-11-07T12:00:00Z') }])[0].section).toBe(CategorizeInboxSectionEnum.ONE_OFFS);
    });
    it('does not multiply MCC support by the number of inbox rows', () => {
        expect(clusters([row, { ...row, transactionId: 2 }], [{ ...evidence, count: 2 }])[0].candidateLabelIds).toEqual([]);
    });
    it('keeps named transfer merchants eligible for exact history even with a catch-all MCC', () => {
        const title = 'Переказ на картку Example Merchant';
        expect(clusters([{ ...row, title, mcc: '4829' }], [{ ...evidence, title }])[0].section).toBe(CategorizeInboxSectionEnum.CONFIDENT);
    });
    it.each([
        ['Переказ на картку Іван', 'Переказ на картку Петро'],
        ['Transfer to card Ivan', 'Transfer to card']
    ])('requires exact history for %s', (title, historyTitle) => {
        const [cluster] = clusters([{ ...row, title }], [{ ...evidence, title: historyTitle, count: 5 }]);
        expect(cluster.candidateLabelIds).toEqual([]);
        expect(cluster.section).not.toBe(CategorizeInboxSectionEnum.CONFIDENT);
        expect(clusters([{ ...row, title }], [{ ...evidence, title }])[0].section).toBe(CategorizeInboxSectionEnum.CONFIDENT);
    });
    it('keeps income and expense evidence separate', () => {
        expect(clusters([{ ...row, type: TransactionTypeEnum.INCOME }])[0].candidateLabelIds).toEqual([]);
    });
    it('places even confident and cash history in Older', () => {
        const operatedAt = new Date('2024-02-01T12:00:00Z');
        expect(clusters([{ ...row, operatedAt }], [{ ...evidence, title: row.title }])[0].section).toBe(CategorizeInboxSectionEnum.OLDER);
        expect(clusters([{ ...row, operatedAt, mcc: '6011' }])[0].section).toBe(CategorizeInboxSectionEnum.OLDER);
    });
});
