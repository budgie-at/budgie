import { categorizeInboxEngineService, CategorizeInboxLabelKindEnum, CategorizeInboxSectionEnum } from '@budgie/categorization';
import { TransactionTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import type { CategorizeInboxClusterInterface, CategorizeInboxListItemType, CategorizeInboxRowInterface } from '@budgie/categorization';

const now = new Date('2026-11-07T12:00:00Z');

const buildRow = (transactionId: number, title: string): CategorizeInboxRowInterface => ({
    transactionId,
    type: TransactionTypeEnum.EXPENSE,
    title,
    operatedAt: now,
    amount: 1_000,
    baseAmount: null,
    baseInstrumentId: null,
    instrumentSymbol: 'UAH',
    mccCategoryId: null,
    categoryId: null,
    tagIds: [],
    mcc: null,
    toIban: null
});

const buildCluster = (
    displayTitle: string,
    section = CategorizeInboxSectionEnum.REVIEW,
    rowCount = 2
): CategorizeInboxClusterInterface => ({
    key: displayTitle,
    displayTitle,
    rows: Array.from({ length: rowCount }, (_value, index) => buildRow(displayTitle.length * 100 + index, displayTitle)),
    totalBaseAmount: null,
    candidateLabelIds: [],
    ruleConditionValue: displayTitle,
    section,
    titlePrefix: null,
    isCashDeposit: false
});

const placeItems = (clusters: CategorizeInboxClusterInterface[]): CategorizeInboxListItemType[] =>
    categorizeInboxEngineService.placeClusters(clusters, { placements: new Map(), clustersByKey: new Map(), peakRowCount: 0 }, new Set(), 1)
        .items;

const describeItems = (items: CategorizeInboxListItemType[]): string[] =>
    items.map(item => {
        if ('rows' in item) {
            return `${item.displayTitle}|${item.titlePrefix ?? ''}`;
        }

        return 'prefix' in item ? `prefix:${item.prefix}:${item.count}` : `section:${item.section}`;
    });

describe('categorization/inbox-title-prefix', () => {
    it.effect('groups clusters sharing the longest word prefix right where the best-ranked member was', () => {
        const items = placeItems([
            buildCluster('Погашення наступного платежу Розетка'),
            buildCluster('Silpo'),
            buildCluster('погашення наступного платежу Comfy'),
            buildCluster('ATB'),
            buildCluster('Погашення наступного платежу Фокстрот')
        ]);

        expect(describeItems(items)).toEqual([
            'section:REVIEW',
            'prefix:Погашення наступного платежу:6',
            'Погашення наступного платежу Розетка|Погашення наступного платежу',
            'погашення наступного платежу Comfy|Погашення наступного платежу',
            'Погашення наступного платежу Фокстрот|Погашення наступного платежу',
            'Silpo|',
            'ATB|'
        ]);

        return Effect.void;
    });

    it.effect('keeps clusters that share fewer than two words or stand alone ungrouped', () => {
        const items = placeItems([buildCluster('Payment to Alice'), buildCluster('Payment from Bob'), buildCluster('Monthly fee Netflix')]);

        expect(describeItems(items)).toEqual(['section:REVIEW', 'Payment to Alice|', 'Payment from Bob|', 'Monthly fee Netflix|']);

        return Effect.void;
    });

    it.effect('shortens the prefix so every member keeps a remainder and skips titles that would be left empty', () => {
        const items = placeItems([buildCluster('Top up'), buildCluster('Top up card'), buildCluster('Top up card Visa')]);

        expect(describeItems(items)).toEqual([
            'section:REVIEW',
            'Top up|',
            'prefix:Top up:4',
            'Top up card|Top up',
            'Top up card Visa|Top up'
        ]);

        return Effect.void;
    });

    it.effect('never groups one-offs and only groups within a section', () => {
        const items = placeItems([
            buildCluster('Card fee January', CategorizeInboxSectionEnum.ONE_OFFS, 1),
            buildCluster('Card fee February', CategorizeInboxSectionEnum.ONE_OFFS, 1),
            buildCluster('Card fee March', CategorizeInboxSectionEnum.REVIEW),
            buildCluster('Card fee April', CategorizeInboxSectionEnum.OLDER)
        ]);

        expect(describeItems(items)).toEqual([
            'section:REVIEW',
            'Card fee March|',
            'section:ONE_OFFS',
            'Card fee January|',
            'Card fee February|',
            'section:OLDER',
            'Card fee April|'
        ]);

        return Effect.void;
    });

    it.effect('detects cash deposits by MCC or title and keeps them out of a dedicated section', () => {
        const [terminal, mccDeposit, salary, withdrawal] = categorizeInboxEngineService
            .buildClusters(
                [
                    { ...buildRow(1, 'Термінал City24 Київ'), type: TransactionTypeEnum.INCOME },
                    { ...buildRow(2, 'Deposit'), type: TransactionTypeEnum.INCOME, mcc: '6011' },
                    { ...buildRow(3, 'Salary'), type: TransactionTypeEnum.INCOME },
                    { ...buildRow(4, 'Cash in Kyiv'), type: TransactionTypeEnum.EXPENSE }
                ].map((row, index) => ({ ...row, amount: (index + 1) * 1_000 })),
                categorizeInboxEngineService.buildContext([], 1, CategorizeInboxLabelKindEnum.CATEGORY),
                now
            )
            .sort((left, right) => left.rows[0].transactionId - right.rows[0].transactionId);

        expect([terminal, mccDeposit, salary, withdrawal].map(cluster => [cluster.isCashDeposit, cluster.section])).toEqual([
            [true, CategorizeInboxSectionEnum.ONE_OFFS],
            [true, CategorizeInboxSectionEnum.ONE_OFFS],
            [false, CategorizeInboxSectionEnum.ONE_OFFS],
            [false, CategorizeInboxSectionEnum.ONE_OFFS]
        ]);

        return Effect.void;
    });
});
