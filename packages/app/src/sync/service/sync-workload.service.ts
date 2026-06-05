import { Log } from '@budgie/logger';

import { emptyFn, getErrorMessage } from '@rnw-community/shared';

import { foregroundWorkloadService } from '../../@generic/service/foreground-workload.service';

class SyncWorkloadService {
    private queue: Promise<unknown> = Promise.resolve();

    @Log(
        (name, work) => `enter name="${name}" workName="${work.name}"`,
        (result, name, work) => `done name="${name}" workName="${work.name}" result=${String(result)}`,
        (error, name, work) => `throw name="${name}" workName="${work.name}" error=${getErrorMessage(error)}`
    )
    async run<T>(name: string, work: () => Promise<T>): Promise<T> {
        const runForegroundWork = () => foregroundWorkloadService.run(work);
        const current = this.queue.then(runForegroundWork, runForegroundWork);
        this.queue = current.catch((error: unknown) => void emptyFn(error, name));

        return current;
    }
}

export const syncWorkloadService = new SyncWorkloadService();
