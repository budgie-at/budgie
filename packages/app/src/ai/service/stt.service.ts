import { WHISPER_SMALL, SpeechToTextModule } from 'react-native-executorch';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { AiNotReadyError } from '../error/ai-not-ready.error';
import { AiSubsystemServiceInterface } from '../interface/ai-subsystem-service.interface';
import { SttSnapshotInterface } from '../interface/stt-snapshot.interface';
import { aiLog } from '../utils/ai-log.util';

import type { SttInvokerInterface } from '@budgie/ai';

class SttService implements AiSubsystemServiceInterface<SttSnapshotInterface>, SttInvokerInterface {
    private snapshot: SttSnapshotInterface = {
        status: AiSubsystemStatusEnum.Idle,
        downloadProgress: 0,
        errorMessage: null,
        committedTranscription: '',
        nonCommittedTranscription: ''
    };
    private instance: SpeechToTextModule | null = null;
    private activeStream: AsyncGenerator<{ committed: string; nonCommitted: string }> | null = null;
    private listeners = new Set<() => void>();
    private pendingOperation: Promise<unknown> = Promise.resolve();

    readonly subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener);

        return () => {
            this.listeners.delete(listener);
        };
    };

    readonly getSnapshot = (): SttSnapshotInterface => this.snapshot;

    get isReady(): boolean {
        return this.snapshot.status === AiSubsystemStatusEnum.Ready;
    }

    get committedTranscription(): string {
        return this.snapshot.committedTranscription;
    }

    get nonCommittedTranscription(): string {
        return this.snapshot.nonCommittedTranscription;
    }

    async start(): Promise<void> {
        aiLog('stt:start:enter', { priorStatus: this.snapshot.status });
        if (this.snapshot.status === AiSubsystemStatusEnum.Ready) {
            return;
        }
        if (this.snapshot.status === AiSubsystemStatusEnum.Downloading || this.snapshot.status === AiSubsystemStatusEnum.Initializing) {
            await this.pendingOperation;

            return;
        }
        this.pendingOperation = this.runStart();
        await this.pendingOperation;
    }

    async stop(): Promise<void> {
        aiLog('stt:stop:enter', { priorStatus: this.snapshot.status });
        await this.pendingOperation;
        if (this.snapshot.status === AiSubsystemStatusEnum.Suspended || this.snapshot.status === AiSubsystemStatusEnum.Disabled) {
            return;
        }
        this.pendingOperation = this.runStop();
        await this.pendingOperation;
    }

    async retry(): Promise<void> {
        aiLog('stt:retry', { fromStatus: this.snapshot.status });
        this.setSnapshot({ status: AiSubsystemStatusEnum.Idle, errorMessage: null });
        await this.start();
    }

    async stream(options?: { readonly language?: string }): Promise<string> {
        aiLog('stt:stream:start');
        if (!this.isReady || !isDefined(this.instance)) {
            throw new AiNotReadyError('stt');
        }
        const started = Date.now();
        this.setSnapshot({ committedTranscription: '', nonCommittedTranscription: '' });
        this.activeStream = this.instance.stream(options as { readonly language?: never } | undefined);
        let lastCommitted = '';
        try {
            for await (const chunk of this.activeStream) {
                this.setSnapshot({
                    committedTranscription: chunk.committed,
                    nonCommittedTranscription: chunk.nonCommitted
                });
                lastCommitted = chunk.committed;
            }
            aiLog('stt:stream:complete', {
                durationMs: Date.now() - started,
                committedLen: lastCommitted.length
            });

            return lastCommitted;
        } finally {
            this.activeStream = null;
        }
    }

    streamStop(): void {
        aiLog('stt:streamStop');
        this.instance?.streamStop();
    }

    streamInsert(waveform: Float32Array | number[]): void {
        this.instance?.streamInsert(waveform);
    }

    private async runStart(): Promise<void> {
        try {
            this.setSnapshot({ status: AiSubsystemStatusEnum.Downloading, downloadProgress: 0 });
            aiLog('stt:download:begin', { model: 'WHISPER_SMALL' });
            this.instance = new SpeechToTextModule();
            await this.instance.load(WHISPER_SMALL, progress => {
                this.setSnapshot({ downloadProgress: progress });
            });
            aiLog('stt:init:complete');
            this.setSnapshot({ status: AiSubsystemStatusEnum.Ready, errorMessage: null });
            aiLog('stt:ready');
        } catch (error: unknown) {
            const message = getErrorMessage(error);
            aiLog('stt:init:throw', { errorMessage: message });
            this.setSnapshot({ status: AiSubsystemStatusEnum.Error, errorMessage: message });
        }
    }

    private async runStop(): Promise<void> {
        try {
            aiLog('stt:stop:release');
            this.instance?.streamStop();
            this.instance?.delete();
            this.instance = null;
            this.activeStream = null;
            this.setSnapshot({
                status: AiSubsystemStatusEnum.Suspended,
                committedTranscription: '',
                nonCommittedTranscription: ''
            });
            aiLog('stt:stop:complete');
        } catch (error: unknown) {
            aiLog('stt:stop:error', { errorMessage: getErrorMessage(error) });
            this.instance = null;
            this.activeStream = null;
            this.setSnapshot({ status: AiSubsystemStatusEnum.Suspended });
        }
    }

    private setSnapshot(patch: Partial<SttSnapshotInterface>): void {
        this.snapshot = { ...this.snapshot, ...patch };
        this.listeners.forEach(listener => {
            listener();
        });
    }
}

export const sttService = new SttService();
