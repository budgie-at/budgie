import { makeTestDbLayer, TestSeedService } from '@budgie-at/test-kit';
import { CategorySourceEnum, RuleActionTypeEnum, TransactionUpdatedByEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { testDb } from '../../harness';
import { seedTitleRule } from '../../harness/seed/seed-title-rule';

import { pushDevice, readOutboxRows, refreshAllBalances } from './apply-harness';
import {
    bootstrapMonoDevices,
    embeddingBoostProbe,
    expectSettled,
    firstAccountIdOf,
    pullWithAutomation,
    reapplyAutomation,
    reapplyOnBoth,
    settleDevices,
    syncIdsOf
} from './automation-harness';

import type { DB } from '@budgie/contracts';

const OPERATED_AT = new Date('2026-10-02T10:00:00Z');

interface CategorizedEntryInterface {
    readonly categoryTitle: string | null;
    readonly categorySource: string;
    readonly updatedBy: string | null;
}

const categorizedEntry = (database: DB) =>
    database.$client
        .unsafe<CategorizedEntryInterface>(
            `SELECT c.title AS categoryTitle, e.category_source AS categorySource, t.updated_by AS updatedBy
            FROM transaction_entries e INNER JOIN transactions t ON t.id = e.transaction_id
            LEFT JOIN categories c ON c.id = e.category_id WHERE t.title = 'Cafe latte'`
        )
        .pipe(Effect.map(([entry]) => entry));

describe('cloud-sync/automation-rules', () => {
    it.layer(makeTestDbLayer(null), { excludeTestServices: true })('two devices', it => {
        it.effect('applies a rule to a synced-in transaction once and does not loop between devices', () =>
            Effect.gen(function* () {
                const { deviceB, cloud, seedB, seeded: account } = yield* bootstrapMonoDevices;
                const category = yield* new TestSeedService(testDb).category('Coffee');

                yield* seedTitleRule('Cafe', { type: RuleActionTypeEnum.SET_CATEGORY, categoryId: category.id, accountId: null });
                yield* seedB.manualExpense({
                    accountId: yield* firstAccountIdOf(deviceB),
                    amount: 5_000_000,
                    operatedAt: OPERATED_AT,
                    title: 'Cafe latte'
                });
                yield* refreshAllBalances(deviceB);

                expect(account.id).toBeGreaterThan(0);
                expect((yield* categorizedEntry(deviceB)).categorySource).not.toBe(CategorySourceEnum.RULE);

                const rounds = yield* settleDevices(testDb, deviceB, cloud);

                for (const database of [testDb, deviceB]) {
                    const entry = yield* categorizedEntry(database);

                    expect(entry.categoryTitle).toBe('Coffee');
                    expect(entry.categorySource).toBe(CategorySourceEnum.RULE);
                    expect(entry.updatedBy).toBe(TransactionUpdatedByEnum.RULE);
                }

                yield* expectSettled(deviceB, rounds, 4);
                yield* reapplyOnBoth(deviceB);
                expect(yield* readOutboxRows(testDb)).toEqual([]);
                expect(yield* readOutboxRows(deviceB)).toEqual([]);
            })
        );

        it.effect('queues synced-in transactions for local embedding only when AI suggestions are enabled, without enqueueing a sync', () =>
            Effect.gen(function* () {
                const { deviceB, cloud, seedB } = yield* bootstrapMonoDevices;

                yield* seedB.manualExpense({
                    accountId: yield* firstAccountIdOf(deviceB),
                    amount: 5_000_000,
                    operatedAt: OPERATED_AT,
                    title: 'Bakery'
                });
                yield* refreshAllBalances(deviceB);
                yield* pushDevice(deviceB, cloud);

                const needsEmbedding = () =>
                    testDb.$client
                        .unsafe<{ readonly needsEmbedding: number }>(
                            `SELECT needs_embedding AS needsEmbedding FROM transactions WHERE title = 'Bakery'`
                        )
                        .pipe(Effect.map(([row]) => row.needsEmbedding));

                yield* testDb.$client.unsafe(`UPDATE settings SET is_ai_suggestions_enabled = 0`);

                const callsBefore = embeddingBoostProbe.calls;

                yield* pullWithAutomation(testDb, cloud, 'device-a');
                yield* Effect.yieldNow;

                expect(yield* needsEmbedding()).toBe(0);
                expect(embeddingBoostProbe.calls).toBe(callsBefore);

                yield* testDb.$client.unsafe(`UPDATE settings SET is_ai_suggestions_enabled = 1`);
                yield* reapplyAutomation(testDb, yield* syncIdsOf(testDb, 'transactions'));
                yield* Effect.yieldNow;

                expect(yield* needsEmbedding()).toBe(1);
                expect(embeddingBoostProbe.calls).toBeGreaterThan(callsBefore);
                expect(yield* readOutboxRows(testDb)).toEqual([]);
            })
        );
    });
});
