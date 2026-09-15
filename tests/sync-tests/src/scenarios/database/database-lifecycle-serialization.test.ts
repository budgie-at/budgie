import { expoDb } from '@app/@generic/drizzle/db/db';
import { DatabaseLifecycleOperationEnum } from '@app/@generic/drizzle/enum/database-lifecycle-operation.enum';
import { databaseLifecycleService } from '@app/@generic/drizzle/service/database-lifecycle.service';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const resetDatabaseLifecycleService = (): void => {
    Object.assign(databaseLifecycleService, {
        inFlightOperations: new Map(),
        isClosed: false,
        pendingOperation: Promise.resolve()
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
            databaseLifecycleService.run(DatabaseLifecycleOperationEnum.REKEY, async () => {
                events.push('rekey:start');
                await databaseLifecycleService.close();
                await Promise.resolve();
                events.push('rekey:end');
            }),
            databaseLifecycleService.run(DatabaseLifecycleOperationEnum.IMPORT, async () => {
                events.push('import:start');
                await databaseLifecycleService.close();
                events.push('import:end');
            })
        ]);

        expect(events).toEqual(['rekey:start', 'rekey:end', 'import:start', 'import:end']);
        expect(vi.mocked(expoDb.closeAsync)).toHaveBeenCalledTimes(1);
    });

    it('reuses the in-flight promise when the same operation is requested twice', async () => {
        const events: string[] = [];
        const runReset = async (): Promise<void> => {
            events.push('reset');
            await Promise.resolve();
        };

        await Promise.all([
            databaseLifecycleService.run(DatabaseLifecycleOperationEnum.RESET, runReset),
            databaseLifecycleService.run(DatabaseLifecycleOperationEnum.RESET, runReset)
        ]);

        expect(events).toEqual(['reset']);
    });

    it('keeps serializing after a failed operation', async () => {
        const events: string[] = [];

        const failing = databaseLifecycleService
            .run(DatabaseLifecycleOperationEnum.IMPORT, async () => {
                events.push('import:start');
                await Promise.resolve();

                throw new Error('import failed');
            })
            .then(
                () => false,
                () => true
            );
        const following = databaseLifecycleService.run(DatabaseLifecycleOperationEnum.REKEY, async () => {
            events.push('rekey:start');
            await Promise.resolve();
        });

        expect(await failing).toBe(true);
        await following;

        expect(events).toEqual(['import:start', 'rekey:start']);
    });
});
