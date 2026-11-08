import { categorizeInboxEngineService, CategorizeInboxLabelKindEnum, CategorizeInboxSectionEnum } from '@budgie/categorization';
import { TransactionTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

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
    it.effect.each(['4829', '6010', '6011', '6012', '6051', '6538', '6540', '5999', '8999', '7299', '7399'])(
        'rejects catch-all MCC %s',
        mcc => {
            expect(clusters([{ ...row, mcc }])[0].candidateLabelIds).toEqual([]);

            return Effect.void;
        }
    );
    it.effect('preserves recent keys and prefixes only older keys', () => {
        expect(clusters([row])[0].key).toBe('EXPENSE|example merchant|5411|');
        expect(clusters([{ ...row, operatedAt: new Date('2024-01-01') }])[0].key).toBe('OLDER|EXPENSE|example merchant|5411|');

        return Effect.void;
    });
    it.effect('falls back to strong MCC evidence after weak brand evidence', () => {
        expect(
            clusters([row], [{ ...evidence, title: 'Example Cafe', mccCategoryId: 2, labelId: 8, count: 2 }, evidence])[0].candidateLabelIds
        ).toEqual([7]);

        return Effect.void;
    });
    it.effect('requires three supporting decisions and a clear fallback majority', () => {
        expect(clusters([row], [{ ...evidence, count: 2 }])[0].candidateLabelIds).toEqual([]);
        expect(clusters([row], [evidence, { ...evidence, labelId: 8, count: 2 }])[0].candidateLabelIds).toEqual([]);
        expect(clusters([row])[0].candidateLabelIds).toEqual([7]);

        return Effect.void;
    });
    it.effect('applies the support threshold to brand fallback', () => {
        expect(clusters([row], [{ ...evidence, title: 'Example Cafe', count: 2 }])[0].candidateLabelIds).toEqual([]);
        expect(clusters([row], [{ ...evidence, title: 'Example Cafe' }])[0].candidateLabelIds).toEqual([7]);

        return Effect.void;
    });
    it.effect.each([
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

        return Effect.void;
    });
    it.effect('preserves merchant history and separates counterparties by IBAN', () => {
        expect(clusters([row], [{ ...evidence, title: row.title }])[0].section).toBe(CategorizeInboxSectionEnum.CONFIDENT);
        expect(
            clusters([
                { ...row, toIban: 'fixture-a' },
                { ...row, transactionId: 2, toIban: 'fixture-b' }
            ])
        ).toHaveLength(2);

        return Effect.void;
    });
    it.effect('splits old rows from recent history and places them after one-offs', () => {
        const result = clusters([
            { ...row, operatedAt: new Date('2025-11-07T11:59:59Z') },
            { ...row, transactionId: 2 }
        ]);
        expect(result.map(cluster => cluster.section)).toEqual([CategorizeInboxSectionEnum.ONE_OFFS, CategorizeInboxSectionEnum.OLDER]);
        expect(clusters([{ ...row, operatedAt: new Date('2025-11-07T12:00:00Z') }])[0].section).toBe(CategorizeInboxSectionEnum.ONE_OFFS);

        return Effect.void;
    });
    it.effect('does not multiply MCC support by the number of inbox rows', () => {
        expect(clusters([row, { ...row, transactionId: 2 }], [{ ...evidence, count: 2 }])[0].candidateLabelIds).toEqual([]);

        return Effect.void;
    });
    it.effect('keeps named transfer merchants eligible for exact history even with a catch-all MCC', () => {
        const title = 'Переказ на картку Example Merchant';
        expect(clusters([{ ...row, title, mcc: '4829' }], [{ ...evidence, title }])[0].section).toBe(CategorizeInboxSectionEnum.CONFIDENT);

        return Effect.void;
    });
    it.effect.each([
        ['Переказ Іван Петренко', 'Переказ Ольга Сидоренко'],
        ['Transfer John Smith', 'Transfer Mary Jones'],
        ['Переказ на картку Іван', 'Переказ на картку Петро'],
        ['Переказ коштів Іван Петренко', 'Переказ коштів Іван Сидоренко'],
        ['Transfer to card Ivan Petrenko', 'Transfer to card Olga Sidorenko'],
        ['Переказ на картку Петренко', 'Переказ на картку Іванов'],
        ['Kartenüberweisung Hans', 'Kartenüberweisung Olga'],
        ['Virement carte Jean', 'Virement carte Pierre'],
        ['Virement SEPA émis vers Martin', 'Virement SEPA émis vers Dupont'],
        ['VIR SEPA EMIS VERS Martin', 'VIR SEPA EMIS VERS Dupont'],
        ['Transf. a favor de Pedro', 'Transf. a favor de Juan'],
        ['Transferencia emitida a favor de Pedro', 'Transferencia emitida a favor de Juan'],
        ['Überweisung an Hans Müller', 'Überweisung an Olga Schmidt'],
        ['Transferencia a tarjeta 1234 Juan', 'Transferencia a tarjeta 5678 Pedro'],
        ['Transfer to card Ivan', 'Transfer to card']
    ])('requires exact history for %s', ([title, historyTitle]) => {
        const [cluster] = clusters([{ ...row, title }], [{ ...evidence, title: historyTitle, count: 5 }]);
        expect(cluster.candidateLabelIds).toEqual([]);
        expect(cluster.section).not.toBe(CategorizeInboxSectionEnum.CONFIDENT);
        expect(clusters([{ ...row, title }], [{ ...evidence, title }])[0].section).toBe(CategorizeInboxSectionEnum.CONFIDENT);
        expect(clusters([{ ...row, title: title.replaceAll(' ', '  ') }], [{ ...evidence, title }])[0].section).toBe(
            CategorizeInboxSectionEnum.CONFIDENT
        );

        return Effect.void;
    });
    it.effect.each([
        ['Überweisung Stadtwerke Wien 01/2026', 'Überweisung Stadtwerke Wien 02/2026'],
        ['Virement Electricite Paris 01/2026', 'Virement Electricite Paris 02/2026'],
        ['Transferencia Energia Madrid 01/2026', 'Transferencia Energia Madrid 02/2026']
    ])('matches varying-reference bill payments for %s', ([title, historyTitle]) => {
        const [cluster] = clusters([{ ...row, title }], [{ ...evidence, title: historyTitle }]);
        expect(cluster.candidateLabelIds).toEqual([7]);
        expect(cluster.section).toBe(CategorizeInboxSectionEnum.CONFIDENT);

        return Effect.void;
    });
    it.effect('lists Older after One-offs with row counts and reuses an older session placement', () => {
        const result = clusters(
            [
                row,
                { ...row, transactionId: 2, operatedAt: new Date('2024-01-01') },
                { ...row, transactionId: 3, operatedAt: new Date('2024-01-02') }
            ],
            []
        );
        const view = categorizeInboxEngineService.placeClusters(
            result,
            { placements: new Map(), clustersByKey: new Map(), peakRowCount: 0 },
            new Set(),
            1
        );
        expect(view.items.filter(item => 'count' in item)).toEqual([
            { key: 'section-ONE_OFFS', section: CategorizeInboxSectionEnum.ONE_OFFS, count: 1, totalBaseAmount: null },
            { key: 'section-OLDER', section: CategorizeInboxSectionEnum.OLDER, count: 2, totalBaseAmount: null }
        ]);
        const next = categorizeInboxEngineService.placeClusters(
            result.map(cluster => ({ ...cluster, section: CategorizeInboxSectionEnum.REVIEW })),
            { ...view, peakRowCount: 3 },
            new Set(),
            1
        );
        expect(next.placements).toBe(view.placements);
        expect(next.clustersByKey).toBe(view.clustersByKey);
        expect(next.items).toEqual(view.items);
        expect(next.remainingCount).toBe(3);

        return Effect.void;
    });
    it.effect('keeps income and expense evidence separate', () => {
        expect(clusters([{ ...row, type: TransactionTypeEnum.INCOME }])[0].candidateLabelIds).toEqual([]);

        return Effect.void;
    });
    it.effect('places even confident and cash history in Older', () => {
        const operatedAt = new Date('2024-02-01T12:00:00Z');
        expect(clusters([{ ...row, operatedAt }], [{ ...evidence, title: row.title }])[0].section).toBe(CategorizeInboxSectionEnum.OLDER);
        expect(clusters([{ ...row, operatedAt, mcc: '6011' }])[0].section).toBe(CategorizeInboxSectionEnum.OLDER);

        return Effect.void;
    });
});
