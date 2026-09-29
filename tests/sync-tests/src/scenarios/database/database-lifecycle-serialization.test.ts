import { expoDb } from '@app/@generic/drizzle/db/db';
import { DatabaseLifecycleOperationEnum } from '@app/@generic/drizzle/enum/database-lifecycle-operation.enum';
import { databaseLifecycleService } from '@app/@generic/drizzle/service/database-lifecycle.service';
import * as Effect from 'effect/Effect';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { run } from '../../harness';

const resetDatabaseLifecycleService = (): void => {
    Object.assign(databaseLifecycleService, {
        inFlightOperations: new Map(),
        isClosed: false
    });
};

describe('database/database-lifecycle-serialization', () => {
    beforeEach(() => {
        resetDatabaseLifecycleService();
        vi.mocked(expoDb.closeAsync).mockClear();
    });

    it('runs a concurrent rekey and import one after the other and closes the handle once', async () => {
        const events: string[] = [];

        await Promise.all([
            run(
                databaseLifecycleService.run(
                    DatabaseLifecycleOperationEnum.REKEY,
                    Effect.gen(function* () {
                        events.push('rekey:start');
                        yield* databaseLifecycleService.close();
                        yield* Effect.promise(() => Promise.resolve());
                        events.push('rekey:end');
                    })
                )
            ),
            run(
                databaseLifecycleService.run(
                    DatabaseLifecycleOperationEnum.IMPORT,
                    Effect.gen(function* () {
                        events.push('import:start');
                        yield* databaseLifecycleService.close();
                        events.push('import:end');
                    })
                )
            )
        ]);

        expect(events).toEqual(['rekey:start', 'rekey:end', 'import:start', 'import:end']);
        expect(vi.mocked(expoDb.closeAsync)).toHaveBeenCalledTimes(1);
    });

    it('reuses the in-flight promise when the same operation is requested twice', async () => {
        const events: string[] = [];
        const runReset = Effect.gen(function* () {
            events.push('reset');
            yield* Effect.promise(() => Promise.resolve());
        });

        await Promise.all([
            run(databaseLifecycleService.run(DatabaseLifecycleOperationEnum.RESET, runReset)),
            run(databaseLifecycleService.run(DatabaseLifecycleOperationEnum.RESET, runReset))
        ]);

        expect(events).toEqual(['reset']);
    });

    it('keeps serializing after a failed operation', async () => {
        const events: string[] = [];

        const failing = run(
            databaseLifecycleService.run(
                DatabaseLifecycleOperationEnum.IMPORT,
                Effect.gen(function* () {
                    events.push('import:start');
                    yield* Effect.promise(() => Promise.resolve());

                    return yield* Effect.fail(new Error('import failed'));
                })
            )
        ).then(
            () => false,
            () => true
        );
        const following = run(
            databaseLifecycleService.run(
                DatabaseLifecycleOperationEnum.REKEY,
                Effect.gen(function* () {
                    events.push('rekey:start');
                    yield* Effect.promise(() => Promise.resolve());
                })
            )
        );

        expect(await failing).toBe(true);
        await following;

        expect(events).toEqual(['import:start', 'rekey:start']);
    });

    it('retries the close when the native handle fails to close', async () => {
        vi.mocked(expoDb.closeAsync).mockRejectedValueOnce(new Error('unable to close due to unfinalized statements'));

        await expect(run(databaseLifecycleService.close())).rejects.toThrow();
        await run(databaseLifecycleService.close());

        expect(vi.mocked(expoDb.closeAsync)).toHaveBeenCalledTimes(2);
    });

    it('closes the native handle once when two closers race', async () => {
        await Promise.all([run(databaseLifecycleService.close()), run(databaseLifecycleService.close())]);

        expect(vi.mocked(expoDb.closeAsync)).toHaveBeenCalledTimes(1);
    });
});
