import { Log } from '@budgie/logger';

import { emptyFn, getErrorMessage } from '@rnw-community/shared';

class SyncWorkloadService {
    private queue: Promise<unknown> = Promise.resolve();

    @Log(
        (name, work) => `enter name="${name}" workName="${work.name}"`,
        (result, name, work) => `done name="${name}" workName="${work.name}" result=${String(result)}`,
        (error, name, work) => `throw name="${name}" workName="${work.name}" error=${getErrorMessage(error)}`
    )
    async run<T>(name: string, work: () => Promise<T>): Promise<T> {
        const current = this.queue.then(work, work);
        this.queue = current.catch((error: unknown) => void emptyFn(error, name));

        return current;
    }
}

export const syncWorkloadService = new SyncWorkloadService();
