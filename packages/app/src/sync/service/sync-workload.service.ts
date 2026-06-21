import { Log } from '@budgie/logger';

import { emptyFn, getErrorMessage } from '@rnw-community/shared';

import { foregroundWorkloadService } from '../../@generic/service/foreground-workload.service';
import { microPause } from '../../@generic/utils/micro-pause.util';

class SyncWorkloadService {
    private queue: Promise<unknown> = Promise.resolve();
    private userQueue: Promise<unknown> = Promise.resolve();
    private readonly queuedUserWorkListeners = new Set<() => void>();
    private activeWork: Promise<unknown> | null = null;
    private generation = 0;
    private priorityGeneration = 0;
    private isAcceptingWork = true;
    private queuedCount = 0;
    private queuedUserCount = 0;

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    cancelPendingAndBlockNewWork(): void {
        this.generation += 1;
        this.priorityGeneration += 1;
        this.isAcceptingWork = false;
        this.queuedCount = 0;
        this.queuedUserCount = 0;
        this.queue = Promise.resolve();
        this.userQueue = Promise.resolve();
    }

    @Log(
        (name, work) => `enter name="${name}" workName="${work.name}"`,
        (result, name, work) => `done name="${name}" workName="${work.name}" result=${String(result)}`,
        (error, name, work) => `throw name="${name}" workName="${work.name}" error=${getErrorMessage(error)}`
    )
    async run<T>(name: string, work: () => Promise<T>): Promise<T> {
        this.throwIfBlocked();
        const { generation } = this;
        const { priorityGeneration } = this;
        const runForegroundWork = () => this.runBackgroundForegroundWork(name, work, generation, priorityGeneration);
        this.queuedCount += 1;
        const current = this.queue.then(runForegroundWork, runForegroundWork);
        this.queue = current.catch((error: unknown) => void emptyFn(error, name));

        return current;
    }

    @Log(
        (name, work) => `enter name="${name}" workName="${work.name}"`,
        (result, name, work) => `done name="${name}" workName="${work.name}" result=${String(result)}`,
        (error, name, work) => `throw name="${name}" workName="${work.name}" error=${getErrorMessage(error)}`
    )
    async runUser<T>(name: string, work: () => Promise<T>): Promise<T> {
        this.throwIfBlocked();
        this.priorityGeneration += 1;
        const { generation } = this;
        const activeOrQueuedUserWork = this.resolveActiveOrQueuedUserWork();
        const runForegroundWork = () => this.runUserForegroundWork(name, work, generation);

        this.queuedCount += 1;
        this.queuedUserCount += 1;
        this.emitQueuedUserWork();

        const current = activeOrQueuedUserWork.then(runForegroundWork, runForegroundWork);
        this.queue = current.catch((error: unknown) => void emptyFn(error, name));
        this.userQueue = current.catch((error: unknown) => void emptyFn(error, name));

        return current;
    }

    @Log(
        delayMs => `enter delayMs=${delayMs}`,
        (result, delayMs) => `done delayMs=${delayMs} queued=${String(result)}`,
        (error, delayMs) => `throw delayMs=${delayMs} error=${getErrorMessage(error)}`
    )
    async waitForQueuedUserWork(delayMs: number): Promise<boolean> {
        if (this.hasQueuedUserWork()) {
            return true;
        }

        const queuedUserWorkWaiter = this.buildQueuedUserWorkWaiter();
        try {
            return await Promise.race([queuedUserWorkWaiter.promise, microPause(delayMs).then(() => false)]);
        } finally {
            queuedUserWorkWaiter.unsubscribe();
        }
    }

    @Log(
        (name, work, generation, priorityGeneration) =>
            `enter name="${name}" workName="${work.name}" generation=${generation} priorityGeneration=${priorityGeneration}`,
        (result, ...[name, work, generation, priorityGeneration]) =>
            `done name="${name}" workName="${work.name}" generation=${generation} priorityGeneration=${priorityGeneration} result=${String(result)}`,
        (error, ...[name, work, generation, priorityGeneration]) =>
            `throw name="${name}" workName="${work.name}" generation=${generation} priorityGeneration=${priorityGeneration} error=${getErrorMessage(error)}`
    )
    private async runBackgroundForegroundWork<T>(
        name: string,
        work: () => Promise<T>,
        generation: number,
        priorityGeneration: number
    ): Promise<T> {
        this.queuedCount = Math.max(0, this.queuedCount - 1);
        if (generation !== this.generation) {
            throw new Error(name);
        }

        if (priorityGeneration !== this.priorityGeneration) {
            throw new Error(name);
        }

        return this.runActiveWork(work);
    }

    @Log(
        (name, work, generation) => `enter name="${name}" workName="${work.name}" generation=${generation}`,
        (result, name, work, generation) => `done name="${name}" workName="${work.name}" generation=${generation} result=${String(result)}`,
        (error, name, work, generation) =>
            `throw name="${name}" workName="${work.name}" generation=${generation} error=${getErrorMessage(error)}`
    )
    private async runUserForegroundWork<T>(name: string, work: () => Promise<T>, generation: number): Promise<T> {
        this.queuedCount = Math.max(0, this.queuedCount - 1);
        this.queuedUserCount = Math.max(0, this.queuedUserCount - 1);
        if (generation !== this.generation) {
            throw new Error(name);
        }

        return this.runActiveWork(work);
    }

    hasQueuedWork(): boolean {
        return this.queuedCount > 0;
    }

    hasQueuedUserWork(): boolean {
        return this.queuedUserCount > 0;
    }

    private resolveActiveOrQueuedUserWork(): Promise<unknown> {
        if (this.queuedUserCount > 0) {
            return this.userQueue;
        }

        return this.activeWork ?? Promise.resolve();
    }

    private async runActiveWork<T>(work: () => Promise<T>): Promise<T> {
        const activeWork = foregroundWorkloadService.run(work);
        this.activeWork = activeWork;

        try {
            return await activeWork;
        } finally {
            if (this.activeWork === activeWork) {
                this.activeWork = null;
            }
        }
    }

    private throwIfBlocked(): void {
        if (!this.isAcceptingWork) {
            throw new Error();
        }
    }

    private buildQueuedUserWorkWaiter() {
        let unsubscribe = emptyFn;
        const promise = new Promise<true>(resolve => {
            const listener = () => {
                unsubscribe();
                resolve(true);
            };
            unsubscribe = () => {
                this.queuedUserWorkListeners.delete(listener);
            };
            this.queuedUserWorkListeners.add(listener);
        });

        return { promise, unsubscribe };
    }

    private emitQueuedUserWork(): void {
        this.queuedUserWorkListeners.forEach(listener => {
            listener();
        });
    }
}

export const syncWorkloadService = new SyncWorkloadService();
