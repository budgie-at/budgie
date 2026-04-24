import { Log, LoggerNamespaceEnum, getLogger } from '@budgie/contracts';
import { SpeechToTextModule, WHISPER_SMALL } from 'react-native-executorch';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { AiNotReadyError } from '../error/ai-not-ready.error';
import { AiSubsystemServiceInterface } from '../interface/ai-subsystem-service.interface';
import { SttSnapshotInterface } from '../interface/stt-snapshot.interface';

import { BaseSubsystemService } from './base-subsystem.service';

import type { SttInvokerInterface } from '@budgie/ai';

const logger = getLogger(LoggerNamespaceEnum.STT);

class SttService
    extends BaseSubsystemService<SttSnapshotInterface>
    implements AiSubsystemServiceInterface<SttSnapshotInterface>, SttInvokerInterface
{
    private instance: SpeechToTextModule | null = null;
    private activeStream: AsyncGenerator<{ committed: string; nonCommitted: string }> | null = null;

    constructor() {
        super('stt', {
            status: AiSubsystemStatusEnum.IDLE,
            downloadProgress: 0,
            errorMessage: null,
            committedTranscription: '',
            nonCommittedTranscription: ''
        });
    }

    get committedTranscription(): string {
        return this.snapshot.committedTranscription;
    }

    get nonCommittedTranscription(): string {
        return this.snapshot.nonCommittedTranscription;
    }

    @Log(LoggerNamespaceEnum.STT, 'stt:retry')
    async retry(): Promise<void> {
        this.setSnapshot({ status: AiSubsystemStatusEnum.IDLE, errorMessage: null });
        await this.start();
    }

    @Log(LoggerNamespaceEnum.STT, 'stt:stream:start')
    // eslint-disable-next-line max-statements -- Async generator consumption with per-chunk snapshot updates
    async stream(options?: { readonly language?: string }): Promise<string> {
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
            logger.log('stt:stream:complete', {
                durationMs: Date.now() - started,
                committedLen: lastCommitted.length
            });

            return lastCommitted;
        } finally {
            this.activeStream = null;
        }
    }

    @Log(LoggerNamespaceEnum.STT, 'stt:streamStop')
    streamStop(): void {
        this.instance?.streamStop();
    }

    streamInsert(waveform: Float32Array | number[]): void {
        this.instance?.streamInsert(waveform);
    }

    protected async runStart(): Promise<void> {
        try {
            this.setSnapshot({ status: AiSubsystemStatusEnum.DOWNLOADING, downloadProgress: 0 });
            logger.log('stt:download:begin', { model: 'WHISPER_SMALL' });
            this.instance = new SpeechToTextModule();
            await this.instance.load(WHISPER_SMALL, progress => {
                this.setSnapshot({ downloadProgress: progress });
            });
            logger.log('stt:init:complete');
            this.setSnapshot({ status: AiSubsystemStatusEnum.READY, errorMessage: null });
            logger.log('stt:ready');
        } catch (error: unknown) {
            const message = getErrorMessage(error);
            logger.log('stt:init:throw', { errorMessage: message });
            this.setSnapshot({ status: AiSubsystemStatusEnum.ERROR, errorMessage: message });
        }
    }

    protected async runStop(): Promise<void> {
        try {
            logger.log('stt:stop:release');
            this.instance?.streamStop();
            this.instance?.delete();
            this.instance = null;
            this.activeStream = null;
            this.setSnapshot({
                status: AiSubsystemStatusEnum.SUSPENDED,
                committedTranscription: '',
                nonCommittedTranscription: ''
            });
            logger.log('stt:stop:complete');
        } catch (error: unknown) {
            logger.log('stt:stop:error', { errorMessage: getErrorMessage(error) });
            this.instance = null;
            this.activeStream = null;
            this.setSnapshot({ status: AiSubsystemStatusEnum.SUSPENDED });
        }
    }
}

export const sttService = new SttService();
