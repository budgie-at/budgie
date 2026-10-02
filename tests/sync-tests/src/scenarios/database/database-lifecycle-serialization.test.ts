import { expoDb } from '@app/@generic/drizzle/db/db';
import { DatabaseLifecycleOperationEnum } from '@app/@generic/drizzle/enum/database-lifecycle-operation.enum';
import { DatabaseLifecycleService } from '@app/@generic/drizzle/service/database-lifecycle.service';
import { beforeEach, describe, expect, it, vi } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';

import { TestLayer } from '../../harness';

describe('database/database-lifecycle-serialization', () => {
    beforeEach(() => {
        vi.mocked(expoDb.closeAsync).mockClear();
    });

    it.effect('runs a concurrent rekey and import one after the other and closes the handle once', () =>
        Effect.gen(function* () {
            const databaseLifecycleService = yield* DatabaseLifecycleService;
            const events: string[] = [];

            yield* Effect.all(
                [
                    databaseLifecycleService.run(
                        DatabaseLifecycleOperationEnum.REKEY,
                        Effect.gen(function* () {
                            events.push('rekey:start');
                            yield* databaseLifecycleService.close();
                            yield* Effect.promise(() => Promise.resolve());
                            events.push('rekey:end');
                        })
                    ),
                    databaseLifecycleService.run(
                        DatabaseLifecycleOperationEnum.IMPORT,
                        Effect.gen(function* () {
                            events.push('import:start');
                            yield* databaseLifecycleService.close();
                            events.push('import:end');
                        })
                    )
                ],
                { concurrency: 'unbounded' }
            );

            expect(events).toEqual(['rekey:start', 'rekey:end', 'import:start', 'import:end']);
            expect(vi.mocked(expoDb.closeAsync)).toHaveBeenCalledTimes(1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('reuses the in-flight promise when the same operation is requested twice', () =>
        Effect.gen(function* () {
            const databaseLifecycleService = yield* DatabaseLifecycleService;
            const events: string[] = [];
            const runReset = Effect.gen(function* () {
                events.push('reset');
                yield* Effect.promise(() => Promise.resolve());
            });

            yield* Effect.all(
                [
                    databaseLifecycleService.run(DatabaseLifecycleOperationEnum.RESET, runReset),
                    databaseLifecycleService.run(DatabaseLifecycleOperationEnum.RESET, runReset)
                ],
                { concurrency: 'unbounded' }
            );

            expect(events).toEqual(['reset']);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps serializing after a failed operation', () =>
        Effect.gen(function* () {
            const databaseLifecycleService = yield* DatabaseLifecycleService;
            const events: string[] = [];

            const failing = databaseLifecycleService.run(
                DatabaseLifecycleOperationEnum.IMPORT,
                Effect.gen(function* () {
                    events.push('import:start');
                    yield* Effect.promise(() => Promise.resolve());

                    return yield* Effect.die(new Error('import failed'));
                })
            );
            const following = databaseLifecycleService.run(
                DatabaseLifecycleOperationEnum.REKEY,
                Effect.gen(function* () {
                    events.push('rekey:start');
                    yield* Effect.promise(() => Promise.resolve());
                })
            );

            const [failingExit] = yield* Effect.all([Effect.exit(failing), following], { concurrency: 'unbounded' });

            expect(Exit.isFailure(failingExit)).toBe(true);
            expect(events).toEqual(['import:start', 'rekey:start']);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('retries the close when the native handle fails to close', () =>
        Effect.gen(function* () {
            const databaseLifecycleService = yield* DatabaseLifecycleService;
            vi.mocked(expoDb.closeAsync).mockRejectedValueOnce(new Error('unable to close due to unfinalized statements'));

            const firstClose = yield* Effect.exit(databaseLifecycleService.close());
            yield* databaseLifecycleService.close();

            expect(Exit.isFailure(firstClose)).toBe(true);
            expect(vi.mocked(expoDb.closeAsync)).toHaveBeenCalledTimes(2);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('closes the native handle once when two closers race', () =>
        Effect.gen(function* () {
            const databaseLifecycleService = yield* DatabaseLifecycleService;

            yield* Effect.all([databaseLifecycleService.close(), databaseLifecycleService.close()], { concurrency: 'unbounded' });

            expect(vi.mocked(expoDb.closeAsync)).toHaveBeenCalledTimes(1);
        }).pipe(Effect.provide(TestLayer))
    );
});
