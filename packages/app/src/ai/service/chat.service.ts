import { GenerateOptionsInterface, stripThinkingTags } from '@budgie/ai';
import { LlamaContext, initLlama } from 'llama.rn';

import { emptyFn, getErrorMessage, isDefined } from '@rnw-community/shared';

import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { AiNotReadyError } from '../error/ai-not-ready.error';
import { AiSubsystemServiceInterface } from '../interface/ai-subsystem-service.interface';
import { ChatSnapshotInterface } from '../interface/chat-snapshot.interface';
import { CHAT_CONTEXT_SIZE, CHAT_MODEL_FILENAME, CHAT_MODEL_URL, GPU_LAYERS } from '../util/ai-constants.util';
import { downloadModel } from '../util/download-model.util';
import { runCompletion } from '../util/run-completion.util';
import { aiLog } from '../utils/ai-log.util';

import type { ChatInvokerInterface } from '@budgie/ai';

class ChatService implements AiSubsystemServiceInterface<ChatSnapshotInterface>, ChatInvokerInterface {
    private snapshot: ChatSnapshotInterface = {
        status: AiSubsystemStatusEnum.Idle,
        downloadProgress: 0,
        errorMessage: null
    };
    private context: LlamaContext | null = null;
    private listeners = new Set<() => void>();
    private pendingOperation: Promise<unknown> = Promise.resolve();
    private mutexChain: Promise<unknown> = Promise.resolve();

    readonly subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener);

        return () => {
            this.listeners.delete(listener);
        };
    };

    readonly getSnapshot = (): ChatSnapshotInterface => this.snapshot;

    get isReady(): boolean {
        return this.snapshot.status === AiSubsystemStatusEnum.Ready;
    }

    async start(): Promise<void> {
        aiLog('chat:start:enter', { priorStatus: this.snapshot.status });
        if (this.snapshot.status === AiSubsystemStatusEnum.Ready) {
            aiLog('chat:start:skip:ready');

            return;
        }
        if (this.snapshot.status === AiSubsystemStatusEnum.Downloading || this.snapshot.status === AiSubsystemStatusEnum.Initializing) {
            aiLog('chat:start:skip:in-flight');
            await this.pendingOperation;

            return;
        }

        this.pendingOperation = this.runStart();
        await this.pendingOperation;
    }

    async stop(): Promise<void> {
        aiLog('chat:stop:enter', { priorStatus: this.snapshot.status });
        await this.pendingOperation;
        if (this.snapshot.status === AiSubsystemStatusEnum.Suspended || this.snapshot.status === AiSubsystemStatusEnum.Disabled) {
            return;
        }
        this.pendingOperation = this.runStop();
        await this.pendingOperation;
    }

    async retry(): Promise<void> {
        aiLog('chat:retry', { fromStatus: this.snapshot.status });
        this.setSnapshot({ status: AiSubsystemStatusEnum.Idle, errorMessage: null });
        await this.start();
    }

    async generate(systemPrompt: string, userMessage: string, options?: GenerateOptionsInterface): Promise<string> {
        aiLog('chat:generate:start', { systemPromptLen: systemPrompt.length, userMessageLen: userMessage.length });
        if (!this.isReady || !isDefined(this.context)) {
            aiLog('chat:generate:throw', { errorName: 'AiNotReadyError' });
            throw new AiNotReadyError('chat');
        }

        const runFn = async (): Promise<string> => {
            if (!isDefined(this.context)) {
                throw new AiNotReadyError('chat');
            }

            return runCompletion(this.context, systemPrompt, userMessage, options);
        };
        const started = Date.now();
        const current = this.mutexChain.then(runFn, runFn);
        this.mutexChain = current.catch(emptyFn);
        try {
            const stripped = stripThinkingTags(await current);
            aiLog('chat:generate:complete', { durationMs: Date.now() - started, resultLen: stripped.length });

            return stripped;
        } catch (error: unknown) {
            aiLog('chat:generate:throw', { errorName: 'runtime', errorMessage: getErrorMessage(error) });
            throw error;
        }
    }

    interrupt(): void {
        aiLog('chat:interrupt');
        void this.context?.stopCompletion();
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
            aiLog('chat:download:begin', { url: CHAT_MODEL_URL, filename: CHAT_MODEL_FILENAME });
            const modelPath = await downloadModel(CHAT_MODEL_URL, CHAT_MODEL_FILENAME, downloadProgress => {
                this.setSnapshot({ downloadProgress });
            });
            aiLog('chat:download:complete', { path: modelPath, durationMs: Date.now() - started });

            this.setSnapshot({ status: AiSubsystemStatusEnum.Initializing });
            aiLog('chat:init:begin');
            const initStarted = Date.now();
            this.context = await initLlama({
                model: modelPath,
                n_ctx: CHAT_CONTEXT_SIZE,
                n_gpu_layers: GPU_LAYERS,
                use_mlock: true,
                embedding: false
            });
            aiLog('chat:init:complete', { durationMs: Date.now() - initStarted });

            this.setSnapshot({ status: AiSubsystemStatusEnum.Ready, errorMessage: null });
            aiLog('chat:ready', { totalBootMs: Date.now() - started });
        } catch (error: unknown) {
            const message = getErrorMessage(error);
            aiLog('chat:init:throw', { errorMessage: message });
            this.setSnapshot({ status: AiSubsystemStatusEnum.Error, errorMessage: message });
        }
    }

    private async runStop(): Promise<void> {
        try {
            aiLog('chat:stop:release');
            if (isDefined(this.context)) {
                await this.context.release();
            }
            this.context = null;
            this.setSnapshot({ status: AiSubsystemStatusEnum.Suspended, downloadProgress: 0 });
            aiLog('chat:stop:complete');
        } catch (error: unknown) {
            aiLog('chat:stop:error', { errorMessage: getErrorMessage(error) });
            this.context = null;
            this.setSnapshot({ status: AiSubsystemStatusEnum.Suspended });
        }
    }

    private setSnapshot(patch: Partial<ChatSnapshotInterface>): void {
        this.snapshot = { ...this.snapshot, ...patch };
        this.listeners.forEach(listener => {
            listener();
        });
    }
}

export const chatService = new ChatService();
