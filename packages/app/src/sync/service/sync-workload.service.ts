import { Log } from '@budgie/logger';
import { t } from '@lingui/core/macro';

import { emptyFn, getErrorMessage } from '@rnw-community/shared';

import { foregroundWorkloadService } from '../../@generic/service/foreground-workload.service';

class SyncWorkloadService {
    private queue: Promise<unknown> = Promise.resolve();
    private generation = 0;
    private isAcceptingWork = true;

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    cancelPendingAndBlockNewWork(): void {
        this.generation += 1;
        this.isAcceptingWork = false;
        this.queue = Promise.resolve();
    }

    @Log(
        (name, work) => `enter name="${name}" workName="${work.name}"`,
        (result, name, work) => `done name="${name}" workName="${work.name}" result=${String(result)}`,
        (error, name, work) => `throw name="${name}" workName="${work.name}" error=${getErrorMessage(error)}`
    )
    async run<T>(name: string, work: () => Promise<T>): Promise<T> {
        if (!this.isAcceptingWork) {
            throw new Error(t`Sync workload is blocked for app reset`);
        }

        const { generation } = this;
        const runForegroundWork = () => {
            if (generation !== this.generation) {
                throw new Error(t`Sync workload was cancelled by app reset`);
            }

            return foregroundWorkloadService.run(work);
        };
        const current = this.queue.then(runForegroundWork, runForegroundWork);
        this.queue = current.catch((error: unknown) => void emptyFn(error, name));

        return current;
    }
}

export const syncWorkloadService = new SyncWorkloadService();
