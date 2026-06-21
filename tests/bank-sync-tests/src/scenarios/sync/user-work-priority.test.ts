import { describe, expect, it } from 'vitest';

import { emptyFn } from '@rnw-community/shared';

import { syncWorkloadService } from '@app/sync/service/sync-workload.service';

describe('sync/user-work-priority', () => {
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

        expect(events).toEqual(['current', 'hasQueuedUserWork:true', 'file-import', 'background:cancelled']);
    });
});
