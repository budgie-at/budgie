import { Log } from '@budgie/logger';

import { emptyFn, getErrorMessage, isDefined, isError } from '@rnw-community/shared';

import { foregroundWorkloadService } from '../../@generic/service/foreground-workload.service';
import { microPause } from '../../@generic/utils/micro-pause.util';

import type { SyncWorkloadQueuedTaskInterface } from '../interface/sync-workload-queued-task.interface';

class SyncWorkloadService {
    private readonly backgroundQueue: SyncWorkloadQueuedTaskInterface[] = [];
    private readonly userQueue: SyncWorkloadQueuedTaskInterface[] = [];
    private readonly queuedUserWorkListeners = new Set<() => void>();
    private isAcceptingWork = true;
    private isRunning = false;

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    cancelPendingAndBlockNewWork(): void {
        this.isAcceptingWork = false;
        this.cancelQueuedWork();
    }

    @Log(
        (name, work) => `enter name="${name}" workName="${work.name}"`,
        (result, name, work) => `done name="${name}" workName="${work.name}" result=${String(result)}`,
        (error, name, work) => `throw name="${name}" workName="${work.name}" error=${getErrorMessage(error)}`
    )
    async run<T>(name: string, work: () => Promise<T>): Promise<T> {
        this.throwIfBlocked();

        return this.enqueueTask(this.backgroundQueue, name, work);
    }

    @Log(
        (name, work) => `enter name="${name}" workName="${work.name}"`,
        (result, name, work) => `done name="${name}" workName="${work.name}" result=${String(result)}`,
        (error, name, work) => `throw name="${name}" workName="${work.name}" error=${getErrorMessage(error)}`
    )
    async runUser<T>(name: string, work: () => Promise<T>): Promise<T> {
        this.throwIfBlocked();
        this.cancelQueuedBackgroundWork();
        const current = this.enqueueTask(this.userQueue, name, work);
        this.emitQueuedUserWork();

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

    hasQueuedWork(): boolean {
        return isDefined(this.userQueue[0]) || isDefined(this.backgroundQueue[0]);
    }

    hasQueuedUserWork(): boolean {
        return isDefined(this.userQueue[0]);
    }

    private enqueueTask<T>(queue: SyncWorkloadQueuedTaskInterface[], name: string, work: () => Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            queue.push({
                cancel: () => {
                    reject(new Error(name));
                },
                name,
                run: async () => {
                    try {
                        resolve(await this.runActiveWork(work));
                    } catch (error) {
                        reject(this.normalizeError(error));
                    }
                }
            });
            this.startDrain();
        });
    }

    private runActiveWork<T>(work: () => Promise<T>): Promise<T> {
        return foregroundWorkloadService.run(work);
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

    private startDrain(): void {
        this.drain().catch((error: unknown) => void emptyFn(error));
    }

    private async drain(): Promise<void> {
        if (this.isRunning) {
            return;
        }

        this.isRunning = true;
        try {
            await this.drainQueuedTasks();
        } finally {
            this.isRunning = false;
            if (this.hasQueuedWork()) {
                this.startDrain();
            }
        }
    }

    private async drainQueuedTasks(): Promise<void> {
        const task = this.takeNextTask();
        if (!isDefined(task)) {
            return;
        }

        await task.run();
        await this.drainQueuedTasks();
    }

    private takeNextTask(): SyncWorkloadQueuedTaskInterface | null {
        return this.userQueue.shift() ?? this.backgroundQueue.shift() ?? null;
    }

    private normalizeError(error: unknown): Error {
        if (isError(error)) {
            return error;
        }

        return new Error(getErrorMessage(error));
    }

    private cancelQueuedWork(): void {
        this.cancelQueuedBackgroundWork();
        this.cancelQueuedUserWork();
    }

    private cancelQueuedBackgroundWork(): void {
        const tasks = this.backgroundQueue.splice(0);
        tasks.forEach(task => {
            task.cancel();
        });
    }

    private cancelQueuedUserWork(): void {
        const tasks = this.userQueue.splice(0);
        tasks.forEach(task => {
            task.cancel();
        });
    }
}

export const syncWorkloadService = new SyncWorkloadService();
