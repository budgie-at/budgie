import { MonobankSyncService } from '@app/sync/service/monobank-sync.service';
import { SyncModeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    buildMonobank,
    fetchPersistedMonobankTransactions,
    fetchSyncById,
    monobankStub,
    setupMonobankFixture,
    TestLayer
} from '../../harness';

import type { StatementItem } from '@liaugust/monobank-sdk';

const PAGE_SIZE = 500;
const MS_PER_SECOND = 1_000;
const PAGE_TX_AMOUNT_KOPECKS = -1000;
const PAGE_BASE_TIME = new Date('2026-01-01T00:00:00Z');
const FIXTURE_FORWARD_FROM = new Date('2025-01-01T00:00:00Z');

const buildBatch = (offset: number): StatementItem[] =>
    Array.from({ length: PAGE_SIZE }, (_, index) => {
        const ordinal = offset + index;

        return buildMonobank.transaction({
            id: `tx-page-${ordinal}`,
            amount: PAGE_TX_AMOUNT_KOPECKS,
            hold: false,
            time: Math.floor(PAGE_BASE_TIME.getTime() / MS_PER_SECOND) + ordinal
        });
    });

describe('monobank/pagination-cursor-advances', () => {
    it.effect('processes a 500-row page, advances the cursor, and continues until the next page is empty', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const { sync } = yield* setupMonobankFixture('mono-acc-1', SyncModeEnum.FORWARD, FIXTURE_FORWARD_FROM);

            monobankStub.statementBatches([buildBatch(0)]);

            yield* monobankSyncService.sync();

            expect(yield* fetchPersistedMonobankTransactions()).toHaveLength(PAGE_SIZE);

            const finalSync = yield* fetchSyncById(sync.id);
            expect(finalSync.forwardSyncedAt).not.toBeNull();
            expect(finalSync.transactionCount).toBe(PAGE_SIZE);
        }).pipe(Effect.provide(TestLayer))
    );
});
