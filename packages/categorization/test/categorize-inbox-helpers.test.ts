import { CategorizeInboxSectionEnum, buildRulePrefillActions, selectAcceptableAssignments } from '@budgie/categorization';
import { TransactionTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';

import type { CategorizeInboxClusterInterface, CategorizeInboxRowInterface } from '@budgie/categorization';

const buildRow = (transactionId: number, categoryId: number | null, tagIds: number[]): CategorizeInboxRowInterface => ({
    transactionId,
    type: TransactionTypeEnum.EXPENSE,
    title: 'SPAR',
    operatedAt: new Date('2026-02-03T09:00:00Z'),
    amount: 1_000,
    baseAmount: null,
    baseInstrumentId: null,
    instrumentSymbol: 'EUR',
    mccCategoryId: null,
    categoryId,
    tagIds,
    mcc: null
});

const buildCluster = (
    key: string,
    section: CategorizeInboxSectionEnum,
    candidateLabelIds: number[],
    rows: CategorizeInboxRowInterface[]
): CategorizeInboxClusterInterface => ({
    key,
    displayTitle: key,
    rows,
    totalBaseAmount: null,
    candidateLabelIds,
    ruleConditionValue: key,
    section
});

describe('categorization/inbox-helpers', () => {
    it('accepts only confident clusters with a candidate and drops excluded rows', () => {
        const items = [
            buildCluster('a', CategorizeInboxSectionEnum.CONFIDENT, [4, 5], [buildRow(1, null, []), buildRow(2, null, [])]),
            buildCluster('b', CategorizeInboxSectionEnum.CONFIDENT, [], [buildRow(3, null, [])]),
            buildCluster('c', CategorizeInboxSectionEnum.CONFIDENT, [6], [buildRow(4, null, [])])
        ];

        const assignments = selectAcceptableAssignments(items, new Set([2, 4]));

        expect(assignments.map(assignment => [assignment.key, assignment.labelId, assignment.rows.map(row => row.transactionId)])).toEqual([
            ['a', 4, [1]]
        ]);
    });

    it('prefers rule actions and merges follow-up and shared tags', () => {
        const rows = [buildRow(1, 7, [1, 2]), buildRow(2, 7, [2, 3])];

        expect(buildRulePrefillActions(null, [9], rows, [8])).toEqual({ categoryId: 7, tagIds: [9, 8, 2] });
        expect(buildRulePrefillActions(5, [], [buildRow(1, 7, []), buildRow(2, 8, [])], [])).toEqual({ categoryId: 5, tagIds: [] });
        expect(buildRulePrefillActions(null, [], [buildRow(1, 7, []), buildRow(2, 8, [])], [])).toEqual({ categoryId: null, tagIds: [] });
    });
});
