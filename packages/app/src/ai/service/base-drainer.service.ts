/* eslint-disable @typescript-eslint/member-ordering, max-lines -- Abstract drainer base co-locates lifecycle, boost, and internal batch loops for readability */
import { Log } from '@budgie/contracts';
import { AppState, InteractionManager } from 'react-native';

import { emptyFn, getErrorMessage, isDefined, isEmptyArray } from '@rnw-community/shared';

import { microPause } from '../../@generic/utils/micro-pause.util';
import { DrainerKindEnum } from '../enum/drainer-kind.enum';
import { DrainerStateEnum } from '../enum/drainer-state.enum';
import { DrainerSnapshotInterface } from '../interface/drainer-snapshot.interface';

import { SnapshotStore } from './base-subsystem.service';
import { drainerMutex } from './drainer-mutex.service';

import type { AppStateStatus } from 'react-native';

const MAX_CONSECUTIVE_FAILURES = 5;
const PROGRESS_LOG_EVERY = 25;
const IDLE_INTERVAL_MS = 10_000;
const MUTEX_BUSY_RESCHEDULE_MS = 1_000;
const ERROR_AUTO_RETRY_MS = 30_000;
const SQLITE_BUSY_PATTERN = /database is locked|SQLITE_BUSY/iu;

export abstract class BaseDrainerService<TRow> extends SnapshotStore<DrainerSnapshotInterface> {
    protected abstract readonly kind: DrainerKindEnum;
    protected abstract readonly relaxedIntervalMs: number;
    protected abstract readonly relaxedBatchSize: number;
    protected abstract readonly boostBatchSize: number;
    protected abstract readonly yieldEveryRows: number;

    protected pendingBatchPromise: Promise<void> = Promise.resolve();

    private consecutiveFailures = 0;
    private timer: ReturnType<typeof setTimeout> | null = null;
    private appStateSubscription: { remove: () => void } | null = null;
    private subsystemUnsubscribe: (() => void) | null = null;
    private started = false;

    constructor() {
        super({ state: DrainerStateEnum.IDLE, pending: 0, lastDurationMs: 0, errorMessage: null });
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    start(): void {
        if (this.started) {
            return;
        }
        this.started = true;
        this.appStateSubscription = AppState.addEventListener('change', this.handleAppState);
        this.subsystemUnsubscribe = this.subscribeToSubsystem(() => {
            if (this.isSubsystemReady()) {
                this.scheduleDrain();
            } else {
                this.haltTimer();
            }
        });
        if (this.isSubsystemReady()) {
            this.scheduleDrain();
        }
        void this.refreshPending();
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    stop(): void {
        if (!this.started) {
            return;
        }
        this.started = false;
        this.haltTimer();
        this.appStateSubscription?.remove();
        this.appStateSubscription = null;
        this.subsystemUnsubscribe?.();
        this.subsystemUnsubscribe = null;
        this.setSnapshot({ state: DrainerStateEnum.IDLE });
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async pause(): Promise<void> {
        if (this.snapshot.state === DrainerStateEnum.PAUSED) {
            return;
        }
        if (this.snapshot.state === DrainerStateEnum.BOOSTING) {
            this.cancelBoost();
        }
        this.haltTimer();
        await this.pendingBatchPromise;
        this.setSnapshot({ state: DrainerStateEnum.PAUSED });
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    resume(): void {
        if (this.snapshot.state !== DrainerStateEnum.PAUSED) {
            return;
        }
        this.setSnapshot({ state: DrainerStateEnum.IDLE });
        if (this.isSafe()) {
            this.scheduleDrain();
        }
        void this.refreshPending();
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    // eslint-disable-next-line max-statements -- Boost entry: guard, mutex, timer halt, snapshot, loop, finally
    async boost(): Promise<void> {
        if (this.getState() === DrainerStateEnum.BOOSTING) {
            return;
        }
        if (!drainerMutex.acquire(this.kind)) {
            return;
        }
        this.haltTimer();
        this.setSnapshot({ state: DrainerStateEnum.BOOSTING, errorMessage: null });
        this.pendingBatchPromise = this.runBoostLoop();
        try {
            await this.pendingBatchPromise;
        } finally {
            drainerMutex.release(this.kind);
            if (this.getState() === DrainerStateEnum.BOOSTING) {
                this.setSnapshot({ state: DrainerStateEnum.IDLE });
            }
            if (this.started && this.isSafe()) {
                this.scheduleDrain();
            }
        }
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    cancelBoost(): void {
        if (this.snapshot.state !== DrainerStateEnum.BOOSTING) {
            return;
        }
        this.setSnapshot({ state: DrainerStateEnum.IDLE });
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    retry(): void {
        this.consecutiveFailures = 0;
        this.setSnapshot({ state: DrainerStateEnum.IDLE, errorMessage: null });
        if (this.started && this.isSafe()) {
            this.scheduleDrain();
        }
    }

    protected abstract subscribeToSubsystem(listener: () => void): () => void;
    protected abstract isSubsystemReady(): boolean;
    protected abstract fetchPending(limit: number): Promise<TRow[]>;
    protected abstract processRow(row: TRow): Promise<void>;
    protected abstract countPending(): Promise<number>;

    protected async afterBatch(): Promise<void> {
        return Promise.resolve();
    }

    protected isSafe(): boolean {
        return this.started && this.isSubsystemReady() && AppState.currentState === 'active';
    }

    private readonly handleAppState = (state: AppStateStatus): void => {
        this.onAppStateChange(state);
    };

    @Log(state => `enter state=${state}`, 'done', error => `throw error=${getErrorMessage(error)}`)
    private onAppStateChange(state: AppStateStatus): void {
        if (state === 'active') {
            this.scheduleDrain();
        } else {
            this.haltTimer();
            if (this.snapshot.state === DrainerStateEnum.BOOSTING) {
                this.cancelBoost();
            }
        }
    }

    private getState(): DrainerStateEnum {
        return this.snapshot.state;
    }

    private haltTimer(): void {
        if (isDefined(this.timer)) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    private canScheduleDrain(): boolean {
        const blockedStates = [DrainerStateEnum.BOOSTING, DrainerStateEnum.PAUSED, DrainerStateEnum.ERROR];

        return this.started && !blockedStates.includes(this.snapshot.state) && this.isSafe();
    }

    private scheduleDrain(): void {
        if (!this.canScheduleDrain()) {
            return;
        }
        this.haltTimer();
        const delay = this.snapshot.pending === 0 ? IDLE_INTERVAL_MS : this.relaxedIntervalMs;
        this.timer = setTimeout(() => {
            this.timer = null;
            void InteractionManager.runAfterInteractions(() => {
                this.pendingBatchPromise = this.runRelaxedTick();
                void this.pendingBatchPromise;
            });
        }, delay);
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    // eslint-disable-next-line max-statements -- Relaxed tick: mutex, fetch, run, refresh, reschedule
    private async runRelaxedTick(): Promise<void> {
        if (!this.isSafe()) {
            return;
        }
        if (!drainerMutex.acquire(this.kind)) {
            this.scheduleDrainAfter(MUTEX_BUSY_RESCHEDULE_MS);

            return;
        }
        try {
            const rows = await this.fetchPending(this.relaxedBatchSize);
            if (isEmptyArray(rows)) {
                return;
            }
            for (const row of rows) {
                if (!this.isSafe() || this.snapshot.state === DrainerStateEnum.ERROR) {
                    break;
                }
                // eslint-disable-next-line no-await-in-loop -- Sequential to avoid Metal thrash
                await this.runRow(row);
            }
        } finally {
            await this.finalizeBatch();
            drainerMutex.release(this.kind);
            if (this.isSafe() && this.snapshot.state !== DrainerStateEnum.ERROR) {
                this.scheduleDrain();
            }
        }
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    private async finalizeBatch(): Promise<void> {
        try {
            await this.afterBatch();
        } catch {
            emptyFn();
        }
        await this.refreshPending();
    }

    private scheduleDrainAfter(ms: number): void {
        if (!this.canScheduleDrain()) {
            return;
        }
        this.haltTimer();
        this.timer = setTimeout(() => {
            this.timer = null;
            this.pendingBatchPromise = this.runRelaxedTick();
            void this.pendingBatchPromise;
        }, ms);
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    // eslint-disable-next-line max-statements -- Boost loop: fetch, row processing, yield, progress log
    private async runBoostLoop(): Promise<void> {
        let processed = 0;
        let rowIndex = 0;
        try {
            /* eslint-disable no-await-in-loop -- Sequential row processing is the whole point of boost */
            while (this.isSafe() && this.getState() === DrainerStateEnum.BOOSTING) {
                const rows = await this.fetchPending(this.boostBatchSize);
                if (isEmptyArray(rows)) {
                    break;
                }
                for (const row of rows) {
                    if (!this.isSafe() || this.getState() !== DrainerStateEnum.BOOSTING) {
                        break;
                    }
                    await this.runRow(row);
                    processed += 1;
                    rowIndex += 1;
                    if (rowIndex % this.yieldEveryRows === 0) {
                        await microPause();
                    }
                    if (processed % PROGRESS_LOG_EVERY === 0) {
                        await this.refreshPending();
                    }
                }
            }
            /* eslint-enable no-await-in-loop */
        } finally {
            await this.finalizeBatch();
        }
    }

    private async runRow(row: TRow): Promise<void> {
        try {
            await this.processRow(row);
            this.consecutiveFailures = 0;
        } catch (error: unknown) {
            this.handleRowFailure(error);
        }
    }

    @Log(error => `enter errorMessage=${getErrorMessage(error)}`, 'done', error => `throw error=${getErrorMessage(error)}`)
    private handleRowFailure(error: unknown): void {
        const message = getErrorMessage(error);
        if (SQLITE_BUSY_PATTERN.test(message)) {
            return;
        }
        this.consecutiveFailures += 1;
        if (this.consecutiveFailures < MAX_CONSECUTIVE_FAILURES) {
            return;
        }
        this.enterErrorState(message);
    }

    @Log(message => `enter message=${message}`, 'done', error => `throw error=${getErrorMessage(error)}`)
    private enterErrorState(message: string): void {
        this.setSnapshot({ state: DrainerStateEnum.ERROR, errorMessage: message });
        this.haltTimer();
        setTimeout(() => {
            this.onAutoRetry();
        }, ERROR_AUTO_RETRY_MS);
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    private onAutoRetry(): void {
        if (this.snapshot.state === DrainerStateEnum.ERROR) {
            this.retry();
        }
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    private async refreshPending(): Promise<void> {
        try {
            const pending = await this.countPending();
            if (pending !== this.snapshot.pending) {
                this.setSnapshot({ pending });
            }
        } catch {
            emptyFn();
        }
    }
}
