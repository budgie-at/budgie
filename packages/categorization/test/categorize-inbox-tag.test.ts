import {
    CategorizeInboxLabelKindEnum,
    CategorizeInboxSectionEnum,
    TransactionCategorizeInboxRepository,
    categorizeInboxEngineService
} from '@budgie/categorization';
import { DEFAULT_TRANSACTION_FILTER, TransactionTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { TestLayer, testSeedService } from './harness/test-context';

import type { CategorizeInboxRowInterface } from '@budgie/categorization';

const buildRow = (transactionId: number, type: TransactionTypeEnum, title: string): CategorizeInboxRowInterface => ({
    transactionId,
    type,
    title,
    operatedAt: new Date('2026-01-03T09:00:00Z'),
    amount: 1_000,
    baseAmount: null,
    baseInstrumentId: null,
    instrumentSymbol: 'EUR',
    mccCategoryId: null,
    mcc: null
});

const buildEvidence = (type: TransactionTypeEnum, title: string) => [{ title, type, mccCategoryId: null, labelId: 7, count: 5 }];

const buildSingleCluster = (
    rows: CategorizeInboxRowInterface[],
    type: TransactionTypeEnum,
    title: string,
    kind: CategorizeInboxLabelKindEnum
) => {
    const [cluster] = categorizeInboxEngineService.buildClusters(
        rows,
        categorizeInboxEngineService.buildContext(buildEvidence(type, title), 1, kind)
    );

    return cluster;
};

describe('categorization/inbox-tag', () => {
    it.effect('excludes untitled transactions from untagged rows', () =>
        Effect.gen(function* () {
            const inboxRepository = yield* TransactionCategorizeInboxRepository;
            const account = yield* testSeedService.account();
            const untitled = yield* testSeedService.bankPairExpense(
                { externalId: 'untitled', operatedAt: new Date('2026-01-03T09:00:00Z') },
                { accountId: account.id, amount: 1_000 }
            );
            const titled = yield* testSeedService.bankPairExpense(
                { externalId: 'titled', operatedAt: new Date('2026-01-03T09:00:00Z') },
                { accountId: account.id, amount: 1_000 }
            );

            yield* testSeedService.updateTransaction(untitled.id, { title: '   ' });
            yield* testSeedService.updateTransaction(titled.id, { title: 'Blue Bottle' });

            const rows = yield* inboxRepository.findUntaggedRows(DEFAULT_TRANSACTION_FILTER);

            expect(rows.map(row => row.transactionId)).toContain(titled.id);
            expect(rows.map(row => row.transactionId)).not.toContain(untitled.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it('keeps refund clusters unconfident and without tag candidates', () => {
        const rows = [1, 2, 3].map(id => buildRow(id, TransactionTypeEnum.INCOME, 'REFUND Blue Bottle'));
        const tagCluster = buildSingleCluster(rows, TransactionTypeEnum.INCOME, 'REFUND Blue Bottle', CategorizeInboxLabelKindEnum.TAG);
        const categoryCluster = buildSingleCluster(
            rows,
            TransactionTypeEnum.INCOME,
            'REFUND Blue Bottle',
            CategorizeInboxLabelKindEnum.CATEGORY
        );

        expect(tagCluster.candidateLabelIds).toEqual([]);
        expect(tagCluster.section).toBe(CategorizeInboxSectionEnum.REVIEW);
        expect(categoryCluster.section).toBe(CategorizeInboxSectionEnum.CONFIDENT);
    });

    it('never marks an oversized cluster confident', () => {
        const buildRows = (count: number) =>
            Array.from({ length: count }, (_, index) => buildRow(index + 1, TransactionTypeEnum.EXPENSE, 'Blue Bottle'));
        const small = buildSingleCluster(buildRows(50), TransactionTypeEnum.EXPENSE, 'Blue Bottle', CategorizeInboxLabelKindEnum.TAG);
        const large = buildSingleCluster(buildRows(51), TransactionTypeEnum.EXPENSE, 'Blue Bottle', CategorizeInboxLabelKindEnum.TAG);

        expect(small.section).toBe(CategorizeInboxSectionEnum.CONFIDENT);
        expect(large.section).toBe(CategorizeInboxSectionEnum.REVIEW);
        expect(large.candidateLabelIds).toEqual([7]);
    });
});
