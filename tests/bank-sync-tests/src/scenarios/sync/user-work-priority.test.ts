import { describe, expect, it } from 'vitest';

import { emptyFn } from '@rnw-community/shared';

import { syncWorkloadService } from '@app/sync/service/sync-workload.service';

const nextTaskDelayMs = 0;

describe('sync/user-work-priority', () => {
    it('runs background work in queue order', async () => {
        const events: string[] = [];

        await Promise.all([
            syncWorkloadService.run('background-one', async () => {
                events.push('background-one');
            }),
            syncWorkloadService.run('background-two', async () => {
                events.push('background-two');
            })
        ]);

        expect(events).toEqual(['background-one', 'background-two']);
    });

    it('runs queued user work before older pending background work', async () => {
        const events: string[] = [];
        const queuedWork: Array<Promise<void>> = [];

        await syncWorkloadService.run('current', async () => {
            events.push('current');
            queuedWork.push(
                syncWorkloadService
                    .run('background', async () => {
                        events.push('background');
                    })
                    .then(emptyFn, () => {
                        events.push('background:cancelled');
                    })
            );
            queuedWork.push(
                syncWorkloadService.runUser('file-import', async () => {
                    events.push('file-import');
                })
            );
            events.push(`hasQueuedUserWork:${String(syncWorkloadService.hasQueuedUserWork())}`);
        });
        await Promise.all(queuedWork);

        expect(events).toContain('background:cancelled');
        expect(events).toContain('file-import');
        expect(events).not.toContain('background');
        expect(events[0]).toBe('current');
        expect(events).toContain('hasQueuedUserWork:true');
    });

    it('rejects queued work immediately when pending work is cancelled', async () => {
        const events: string[] = [];
        let releaseCurrentWork = emptyFn;

        const currentWork = new Promise<void>(resolve => {
            releaseCurrentWork = resolve;
        });
        const runningWork = syncWorkloadService.run('current', async () => {
            events.push('current');
            await currentWork;
        });

        await Promise.resolve();

        const queuedWorkRejected = syncWorkloadService
            .run('background', async () => {
                events.push('background');
            })
            .then(
                () => false,
                () => true
            );

        syncWorkloadService.cancelPendingAndBlockNewWork();

        const isQueuedWorkRejected = await Promise.race([
            queuedWorkRejected,
            new Promise<false>(resolve => {
                setTimeout(() => {
                    resolve(false);
                }, nextTaskDelayMs);
            })
        ]);
        expect(isQueuedWorkRejected).toBe(true);

        releaseCurrentWork();
        await runningWork;
        expect(events).toEqual(['current']);
    });
});
