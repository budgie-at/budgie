/* eslint-disable max-classes-per-file -- Four tiers of base service class co-located here; separating into four files would hide the inheritance chain */
import { Log } from '@budgie/logger';
import { LlamaContext } from 'llama.rn';

import { emptyFn, getErrorMessage, isDefined } from '@rnw-community/shared';

import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { LlamaSubsystemSnapshotInterface } from '../interface/llama-subsystem-snapshot.interface';
import { loadLlamaContext } from '../util/load-llama-context.util';

export abstract class SnapshotStore<TSnapshot> {
    protected snapshot: TSnapshot;
    private readonly listeners = new Set<() => void>();

    constructor(initialSnapshot: TSnapshot) {
        this.snapshot = initialSnapshot;
    }

    readonly subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener);

        return () => {
            this.listeners.delete(listener);
        };
    };

    readonly getSnapshot = (): TSnapshot => this.snapshot;

    protected setSnapshot(patch: Partial<TSnapshot>): void {
        this.snapshot = { ...this.snapshot, ...patch };
        this.listeners.forEach(listener => {
            listener();
        });
    }
}

export abstract class ScheduledSnapshotStore<TSnapshot> extends SnapshotStore<TSnapshot> {
    private unsubscribers: (() => void)[] = [];
    private started = false;
    private dirty = false;

    start(): void {
        if (this.started) {
            return;
        }
        this.started = true;
        this.unsubscribers = this.buildSubscriptions();
        this.recompute();
    }

    stop(): void {
        this.unsubscribers.forEach(fn => {
            fn();
        });
        this.unsubscribers = [];
        this.started = false;
        this.setSnapshot(this.emptySnapshot());
    }

    protected readonly scheduleRecompute = (): void => {
        if (this.dirty) {
            return;
        }
        this.dirty = true;
        queueMicrotask(() => {
            this.dirty = false;
            this.recompute();
        });
    };

    protected abstract buildSubscriptions(): (() => void)[];
    protected abstract emptySnapshot(): TSnapshot;
    protected abstract recompute(): void;
}

interface SnapshotWithStatus {
    readonly status: AiSubsystemStatusEnum;
}

export abstract class BaseSubsystemService<TSnapshot extends SnapshotWithStatus> extends SnapshotStore<TSnapshot> {
    protected pendingOperation: Promise<unknown> = Promise.resolve();

    constructor(
        protected readonly logDomain: string,
        initialSnapshot: TSnapshot
    ) {
        super(initialSnapshot);
    }

    get isReady(): boolean {
        return this.snapshot.status === AiSubsystemStatusEnum.READY;
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async start(): Promise<void> {
        if (this.snapshot.status === AiSubsystemStatusEnum.READY) {
            return;
        }
        if (this.snapshot.status === AiSubsystemStatusEnum.DOWNLOADING || this.snapshot.status === AiSubsystemStatusEnum.INITIALIZING) {
            await this.pendingOperation;

            return;
        }

        this.pendingOperation = this.runStart();
        await this.pendingOperation;
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async stop(): Promise<void> {
        await this.pendingOperation;
        if (this.snapshot.status === AiSubsystemStatusEnum.SUSPENDED || this.snapshot.status === AiSubsystemStatusEnum.DISABLED) {
            return;
        }
        this.pendingOperation = this.runStop();
        await this.pendingOperation;
    }

    abstract retry(): Promise<void>;

    protected abstract runStart(): Promise<void>;
    protected abstract runStop(): Promise<void>;
}

interface LlamaConfigInterface {
    readonly modelUrl: string;
    readonly modelFilename: string;
    readonly contextSize: number;
    readonly embedding: boolean;
    readonly poolingType?: 'mean' | 'none' | 'cls' | 'last';
}

export abstract class BaseLlamaSubsystemService extends BaseSubsystemService<LlamaSubsystemSnapshotInterface> {
    protected context: LlamaContext | null = null;

    constructor(logDomain: string) {
        super(logDomain, { status: AiSubsystemStatusEnum.IDLE, downloadProgress: 0, errorMessage: null });
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async retry(): Promise<void> {
        this.setSnapshot({ status: AiSubsystemStatusEnum.IDLE, errorMessage: null });
        await this.start();
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    protected async runStart(): Promise<void> {
        if (isDefined(this.context)) {
            try {
                await this.context.release();
            } catch {
                emptyFn();
            }
            this.context = null;
        }
        try {
            this.context = await loadLlamaContext({
                domain: this.logDomain,
                ...this.getLlamaConfig(),
                onDownloadBegin: () => void this.setSnapshot({ status: AiSubsystemStatusEnum.DOWNLOADING, downloadProgress: 0 }),
                onDownloadProgress: downloadProgress => void this.setSnapshot({ downloadProgress }),
                onInitBegin: () => void this.setSnapshot({ status: AiSubsystemStatusEnum.INITIALIZING })
            });
            this.setSnapshot({ status: AiSubsystemStatusEnum.READY, errorMessage: null });
        } catch (error: unknown) {
            const message = getErrorMessage(error);
            this.setSnapshot({ status: AiSubsystemStatusEnum.ERROR, errorMessage: message });
        }
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    protected async runStop(): Promise<void> {
        try {
            if (isDefined(this.context)) {
                await this.context.release();
            }
            this.context = null;
            this.setSnapshot({ status: AiSubsystemStatusEnum.SUSPENDED, downloadProgress: 0 });
        } catch {
            this.context = null;
            this.setSnapshot({ status: AiSubsystemStatusEnum.SUSPENDED });
        }
    }

    protected abstract getLlamaConfig(): LlamaConfigInterface;
}
