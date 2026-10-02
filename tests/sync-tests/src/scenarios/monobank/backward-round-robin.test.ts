import { SyncEntityTable, SyncModeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { monobankStub, MonobankSyncService, seed, testDb, TestLayer } from '../../harness';

const seedBackwardSyncs = () =>
    Effect.forEach(['mono-a', 'mono-b', 'mono-c'], externalId =>
        Effect.gen(function* () {
            const account = yield* seed.account({ externalId });

            return (yield* seed.sync({ accountId: account.id, mode: SyncModeEnum.BACKWARD, backwardSyncFromAt: new Date() })).id;
        })
    );

const recordFirstRequests = Effect.fnUntraced(function* (count: number) {
    const monobankSyncService = yield* MonobankSyncService;
    const requestedAccountIds: string[] = [];
    monobankStub.recordStatementAccountIds(requestedAccountIds);

    yield* monobankSyncService.sync();

    return requestedAccountIds.slice(0, count);
});

describe('monobank/backward-round-robin', () => {
    it.effect('gives every unfinished account one backward batch before any account gets its next one', () =>
        Effect.gen(function* () {
            yield* seedBackwardSyncs();

            expect(yield* recordFirstRequests(6)).toStrictEqual(['mono-a', 'mono-b', 'mono-c', 'mono-a', 'mono-b', 'mono-c']);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('resumes the rotation from persisted batch times after a restart', () =>
        Effect.gen(function* () {
            const [monoASyncId] = yield* seedBackwardSyncs();
            yield* testDb.update(SyncEntityTable).set({ backwardBatchAt: new Date() }).where(eq(SyncEntityTable.id, monoASyncId));

            expect(yield* recordFirstRequests(3)).toStrictEqual(['mono-b', 'mono-c', 'mono-a']);
        }).pipe(Effect.provide(TestLayer))
    );
});
