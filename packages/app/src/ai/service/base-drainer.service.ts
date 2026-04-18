/* eslint-disable @typescript-eslint/member-ordering, max-lines -- Abstract drainer base co-locates lifecycle, boost, and internal batch loops for readability */
import { AppState, AppStateStatus } from 'react-native';

import { getErrorMessage } from '@rnw-community/shared';

import { microPause } from '../../@generic/utils/micro-pause.util';
import { DrainerKindEnum } from '../enum/drainer-kind.enum';
import { DrainerStateEnum } from '../enum/drainer-state.enum';
import { DrainerSnapshotInterface } from '../interface/drainer-snapshot.interface';
import { aiLog } from '../utils/ai-log.util';

import { SnapshotStore } from './base-subsystem.service';
import { drainerMutex } from './drainer-mutex.service';

const MAX_CONSECUTIVE_FAILURES = 5;
const PROGRESS_LOG_EVERY = 25;

export abstract class BaseDrainerService<TRow> extends SnapshotStore<DrainerSnapshotInterface> {
    protected abstract readonly kind: DrainerKindEnum;
    protected abstract readonly logDomain: string;
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
        super({ state: DrainerStateEnum.Idle, pending: 0, lastDurationMs: 0, errorMessage: null });
    }

    start(): void {
        if (this.started) {
            return;
        }
        aiLog(`${this.logDomain}:start`);
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

    stop(): void {
        if (!this.started) {
            return;
        }
        aiLog(`${this.logDomain}:stop`);
        this.started = false;
        this.haltTimer();
        this.appStateSubscription?.remove();
        this.appStateSubscription = null;
        this.subsystemUnsubscribe?.();
        this.subsystemUnsubscribe = null;
        this.setSnapshot({ state: DrainerStateEnum.Idle });
    }

    async pause(): Promise<void> {
        if (this.snapshot.state === DrainerStateEnum.Paused) {
            return;
        }
        aiLog(`${this.logDomain}:pause`);
        if (this.snapshot.state === DrainerStateEnum.Boosting) {
            this.cancelBoost();
        }
        this.haltTimer();
        await this.pendingBatchPromise;
        this.setSnapshot({ state: DrainerStateEnum.Paused });
    }

    resume(): void {
        if (this.snapshot.state !== DrainerStateEnum.Paused) {
            return;
        }
        aiLog(`${this.logDomain}:resume`);
        this.setSnapshot({ state: DrainerStateEnum.Idle });
        if (this.isSafe()) {
            this.scheduleDrain();
        }
        void this.refreshPending();
    }

    // eslint-disable-next-line max-statements -- Boost entry: guard, mutex, timer halt, snapshot, loop, finally
    async boost(): Promise<void> {
        if (this.getState() === DrainerStateEnum.Boosting) {
            return;
        }
        if (!drainerMutex.acquire(this.kind)) {
            return;
        }
        aiLog(`${this.logDomain}:boost:begin`);
        this.haltTimer();
        this.setSnapshot({ state: DrainerStateEnum.Boosting, errorMessage: null });
        const started = Date.now();
        this.pendingBatchPromise = this.runBoostLoop(started);
        try {
            await this.pendingBatchPromise;
        } finally {
            drainerMutex.release(this.kind);
            if (this.getState() === DrainerStateEnum.Boosting) {
                this.setSnapshot({ state: DrainerStateEnum.Idle });
            }
            if (this.started && this.isSafe()) {
                this.scheduleDrain();
            }
        }
    }

    private getState(): DrainerStateEnum {
        return this.snapshot.state;
    }

    cancelBoost(): void {
        if (this.snapshot.state !== DrainerStateEnum.Boosting) {
            return;
        }
        aiLog(`${this.logDomain}:boost:cancel`);
        this.setSnapshot({ state: DrainerStateEnum.Idle });
    }

    retry(): void {
        aiLog(`${this.logDomain}:retry`, { fromState: this.snapshot.state });
        this.consecutiveFailures = 0;
        this.setSnapshot({ state: DrainerStateEnum.Idle, errorMessage: null });
        if (this.started && this.isSafe()) {
            this.scheduleDrain();
        }
    }

    protected abstract subscribeToSubsystem(listener: () => void): () => void;
    protected abstract isSubsystemReady(): boolean;
    protected abstract fetchPending(limit: number): Promise<readonly TRow[]>;
    protected abstract processRow(row: TRow): Promise<void>;
    protected abstract countPending(): Promise<number>;

    protected isSafe(): boolean {
        return this.started && this.isSubsystemReady() && AppState.currentState === 'active';
    }

    private readonly handleAppState = (state: AppStateStatus): void => {
        aiLog(`${this.logDomain}:appstate:change`, { to: state });
        if (state === 'active') {
            this.scheduleDrain();
        } else {
            this.haltTimer();
            if (this.snapshot.state === DrainerStateEnum.Boosting) {
                this.cancelBoost();
            }
        }
    };

    private haltTimer(): void {
        if (this.timer !== null) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    private scheduleDrain(): void {
        if (!this.started) {
            return;
        }
        if (this.snapshot.state === DrainerStateEnum.Boosting) {
            return;
        }
        if (this.snapshot.state === DrainerStateEnum.Paused) {
            return;
        }
        if (this.snapshot.state === DrainerStateEnum.Error) {
            return;
        }
        if (!this.isSafe()) {
            return;
        }
        this.haltTimer();
        this.timer = setTimeout(() => {
            this.timer = null;
            this.pendingBatchPromise = this.runRelaxedTick();
            void this.pendingBatchPromise;
        }, this.relaxedIntervalMs);
    }

    // eslint-disable-next-line max-statements -- Relaxed tick: fetch, run, refresh, reschedule
    private async runRelaxedTick(): Promise<void> {
        if (!this.isSafe()) {
            return;
        }
        aiLog(`${this.logDomain}:tick`);
        const started = Date.now();
        try {
            const rows = await this.fetchPending(this.relaxedBatchSize);
            if (rows.length === 0) {
                await this.refreshPending();

                return;
            }
            await this.runRows(rows);
            await this.refreshPending();
            aiLog(`${this.logDomain}:batch:complete`, {
                durationMs: Date.now() - started,
                processed: rows.length,
                pending: this.snapshot.pending
            });
        } catch (error: unknown) {
            aiLog(`${this.logDomain}:batch:throw`, { errorMessage: getErrorMessage(error) });
        } finally {
            if (this.isSafe() && this.snapshot.state !== DrainerStateEnum.Error) {
                this.scheduleDrain();
            }
        }
    }

    // eslint-disable-next-line max-statements -- Boost loop: fetch, row processing, yield, progress log
    private async runBoostLoop(startedAt: number): Promise<void> {
        let processed = 0;
        let rowIndex = 0;
        try {
            /* eslint-disable no-await-in-loop -- Sequential row processing is the whole point of boost */
            while (this.isSafe() && this.getState() === DrainerStateEnum.Boosting) {
                const rows = await this.fetchPending(this.boostBatchSize);
                if (rows.length === 0) {
                    break;
                }
                for (const row of rows) {
                    if (!this.isSafe() || this.getState() !== DrainerStateEnum.Boosting) {
                        break;
                    }
                    await this.runRow(row);
                    processed += 1;
                    rowIndex += 1;
                    if (rowIndex % this.yieldEveryRows === 0) {
                        await microPause();
                    }
                    if (processed % PROGRESS_LOG_EVERY === 0) {
                        aiLog(`${this.logDomain}:boost:progress`, { processed });
                        await this.refreshPending();
                    }
                }
            }
            /* eslint-enable no-await-in-loop */
        } finally {
            await this.refreshPending();
            aiLog(`${this.logDomain}:boost:complete`, {
                durationMs: Date.now() - startedAt,
                processed,
                pending: this.snapshot.pending
            });
        }
    }

    private async runRows(rows: readonly TRow[]): Promise<void> {
        /* eslint-disable no-await-in-loop -- Sequential to avoid Metal thrash */
        for (const row of rows) {
            if (!this.isSafe() || this.snapshot.state === DrainerStateEnum.Error) {
                return;
            }
            await this.runRow(row);
        }
        /* eslint-enable no-await-in-loop */
    }

    private async runRow(row: TRow): Promise<void> {
        try {
            await this.processRow(row);
            this.consecutiveFailures = 0;
        } catch (error: unknown) {
            this.consecutiveFailures += 1;
            aiLog(`${this.logDomain}:row:throw`, {
                errorMessage: getErrorMessage(error),
                consecutiveFailures: this.consecutiveFailures
            });
            if (this.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
                aiLog(`${this.logDomain}:error:cap-reached`, { consecutiveFailures: this.consecutiveFailures });
                this.setSnapshot({ state: DrainerStateEnum.Error, errorMessage: getErrorMessage(error) });
                this.haltTimer();
            }
        }
    }

    private async refreshPending(): Promise<void> {
        try {
            const pending = await this.countPending();
            if (pending !== this.snapshot.pending) {
                this.setSnapshot({ pending });
            }
        } catch (error: unknown) {
            aiLog(`${this.logDomain}:refresh-pending:throw`, { errorMessage: getErrorMessage(error) });
        }
    }
}
