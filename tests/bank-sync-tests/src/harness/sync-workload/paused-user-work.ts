import { emptyFn } from '@rnw-community/shared';

import { syncWorkloadService } from '@app/sync/service/sync-workload.service';

export class PausedUserWork {
    readonly started: Promise<void>;
    readonly work: Promise<void>;

    private releaseWork = emptyFn;
    private markStarted = emptyFn;

    constructor(name: string, onStart: () => void = emptyFn) {
        const releaseSignal = new Promise<void>(resolve => {
            this.releaseWork = resolve;
        });
        this.started = new Promise<void>(resolve => {
            this.markStarted = resolve;
        });
        this.work = syncWorkloadService.runUser(name, async () => {
            onStart();
            this.markStarted();
            await releaseSignal;
        });
    }

    release(): void {
        this.releaseWork();
    }
}
