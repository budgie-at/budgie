import { LlamaContext, initLlama } from 'llama.rn';

import { emptyFn, getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { AiSubsystemServiceInterface } from '../interface/ai-subsystem-service.interface';
import { EmbeddingSnapshotInterface } from '../interface/embedding-snapshot.interface';
import { EMBEDDING_CONTEXT_SIZE, EMBEDDING_MODEL_FILENAME, EMBEDDING_MODEL_URL, GPU_LAYERS } from '../util/ai-constants.util';
import { downloadModel } from '../util/download-model.util';
import { aiLog } from '../utils/ai-log.util';

import type { EmbeddingInvokerInterface } from '@budgie/ai';

class LocalEmbeddingService implements AiSubsystemServiceInterface<EmbeddingSnapshotInterface>, EmbeddingInvokerInterface {
    private snapshot: EmbeddingSnapshotInterface = {
        status: AiSubsystemStatusEnum.Idle,
        downloadProgress: 0,
        errorMessage: null
    };
    private context: LlamaContext | null = null;
    private listeners = new Set<() => void>();
    private pendingOperation: Promise<unknown> = Promise.resolve();

    readonly subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener);

        return () => {
            this.listeners.delete(listener);
        };
    };

    readonly getSnapshot = (): EmbeddingSnapshotInterface => this.snapshot;

    get isReady(): boolean {
        return this.snapshot.status === AiSubsystemStatusEnum.Ready;
    }

    async start(): Promise<void> {
        aiLog('embedding:start:enter', { priorStatus: this.snapshot.status });
        if (this.snapshot.status === AiSubsystemStatusEnum.Ready) {
            aiLog('embedding:start:skip:ready');

            return;
        }
        if (this.snapshot.status === AiSubsystemStatusEnum.Downloading || this.snapshot.status === AiSubsystemStatusEnum.Initializing) {
            aiLog('embedding:start:skip:in-flight');
            await this.pendingOperation;

            return;
        }
        this.pendingOperation = this.runStart();
        await this.pendingOperation;
    }

    async stop(): Promise<void> {
        aiLog('embedding:stop:enter', { priorStatus: this.snapshot.status });
        await this.pendingOperation;
        if (this.snapshot.status === AiSubsystemStatusEnum.Suspended || this.snapshot.status === AiSubsystemStatusEnum.Disabled) {
            return;
        }
        this.pendingOperation = this.runStop();
        await this.pendingOperation;
    }

    async retry(): Promise<void> {
        aiLog('embedding:retry', { fromStatus: this.snapshot.status });
        this.setSnapshot({ status: AiSubsystemStatusEnum.Idle, errorMessage: null });
        await this.start();
    }

    async embed(text: string): Promise<number[]> {
        aiLog('embedding:embed:start', { textLen: text.length, text: text.slice(0, 80) });
        if (!this.isReady || !isDefined(this.context)) {
            aiLog('embedding:embed:empty', { reason: 'not-ready' });

            return [];
        }
        const started = Date.now();
        try {
            const result = await this.context.embedding(text);
            aiLog('embedding:embed:complete', { durationMs: Date.now() - started, dimensions: result.embedding.length });

            return result.embedding;
        } catch (error: unknown) {
            aiLog('embedding:embed:empty', { reason: 'native-throw', errorMessage: getErrorMessage(error) });

            return [];
        }
    }

    async batchEmbed(texts: readonly string[]): Promise<Map<string, number[]>> {
        aiLog('embedding:batchEmbed:start', { textsCount: texts.length });
        if (!this.isReady || !isDefined(this.context) || texts.length === 0) {
            return new Map();
        }
        const started = Date.now();
        const results = new Map<string, number[]>();
        let skipped = 0;
        /* eslint-disable no-await-in-loop -- Sequential batch embedding to avoid Metal thrash */
        for (const text of texts) {
            if (!this.isReady) {
                skipped += 1;
                continue;
            }
            try {
                const result = await this.context.embedding(text);
                if (isNotEmptyArray(result.embedding)) {
                    results.set(text, result.embedding);
                }
            } catch {
                emptyFn();
            }
        }
        /* eslint-enable no-await-in-loop */
        aiLog('embedding:batchEmbed:complete', { durationMs: Date.now() - started, resolved: results.size, skipped });

        return results;
    }

    private async runStart(): Promise<void> {
        if (isDefined(this.context)) {
            try {
                await this.context.release();
            } catch {
                emptyFn();
            }
            this.context = null;
        }
        const started = Date.now();
        try {
            this.setSnapshot({ status: AiSubsystemStatusEnum.Downloading, downloadProgress: 0 });
            aiLog('embedding:download:begin', { url: EMBEDDING_MODEL_URL, filename: EMBEDDING_MODEL_FILENAME });
            const modelPath = await downloadModel(EMBEDDING_MODEL_URL, EMBEDDING_MODEL_FILENAME, downloadProgress => {
                this.setSnapshot({ downloadProgress });
            });
            aiLog('embedding:download:complete', { path: modelPath, durationMs: Date.now() - started });

            this.setSnapshot({ status: AiSubsystemStatusEnum.Initializing });
            aiLog('embedding:init:begin');
            const initStarted = Date.now();
            this.context = await initLlama({
                model: modelPath,
                n_ctx: EMBEDDING_CONTEXT_SIZE,
                n_gpu_layers: GPU_LAYERS,
                use_mlock: true,
                embedding: true,
                pooling_type: 'mean'
            });
            aiLog('embedding:init:complete', { durationMs: Date.now() - initStarted });

            this.setSnapshot({ status: AiSubsystemStatusEnum.Ready, errorMessage: null });
            aiLog('embedding:ready', { totalBootMs: Date.now() - started });
        } catch (error: unknown) {
            const message = getErrorMessage(error);
            aiLog('embedding:init:throw', { errorMessage: message });
            this.setSnapshot({ status: AiSubsystemStatusEnum.Error, errorMessage: message });
        }
    }

    private async runStop(): Promise<void> {
        try {
            aiLog('embedding:stop:release');
            if (isDefined(this.context)) {
                await this.context.release();
            }
            this.context = null;
            this.setSnapshot({ status: AiSubsystemStatusEnum.Suspended, downloadProgress: 0 });
            aiLog('embedding:stop:complete');
        } catch (error: unknown) {
            aiLog('embedding:stop:error', { errorMessage: getErrorMessage(error) });
            this.context = null;
            this.setSnapshot({ status: AiSubsystemStatusEnum.Suspended });
        }
    }

    private setSnapshot(patch: Partial<EmbeddingSnapshotInterface>): void {
        this.snapshot = { ...this.snapshot, ...patch };
        this.listeners.forEach(listener => {
            listener();
        });
    }
}

export const embeddingService = new LocalEmbeddingService();
