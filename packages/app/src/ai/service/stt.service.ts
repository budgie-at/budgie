import { Log, getLogger } from '@budgie/logger';
import { SpeechToTextModule, WHISPER_SMALL } from 'react-native-executorch';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { AiNotReadyError } from '../error/ai-not-ready.error';
import { AiSubsystemServiceInterface } from '../interface/ai-subsystem-service.interface';
import { SttSnapshotInterface } from '../interface/stt-snapshot.interface';

import { BaseSubsystemService } from './base-subsystem.service';

import type { SttInvokerInterface } from '@budgie/ai';
const sttLogger = getLogger('SttService');

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

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`) async retry(): Promise<void> {
        this.setSnapshot({ status: AiSubsystemStatusEnum.IDLE, errorMessage: null });
        await this.start();
    }

    @Log(
        options => `enter language=${options?.language ?? 'default'}`,
        (result, options) => `done language=${options?.language ?? 'default'} committedLen=${result.length}`,
        (error, options) => `throw language=${options?.language ?? 'default'} error=${getErrorMessage(error)}`
    )
    async stream(options?: { readonly language?: string }): Promise<string> {
        if (!this.isReady || !isDefined(this.instance)) {
            throw new AiNotReadyError('stt');
        }
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

            return lastCommitted;
        } finally {
            this.activeStream = null;
        }
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`) streamStop(): void {
        this.instance?.streamStop();
    }

    @Log(() => 'enter model=WHISPER_SMALL', 'done', error => `throw error=${getErrorMessage(error)}`)
    private async downloadModel(): Promise<void> {
        this.setSnapshot({ status: AiSubsystemStatusEnum.DOWNLOADING, downloadProgress: 0 });
        this.instance = new SpeechToTextModule();
        await this.instance.load(WHISPER_SMALL, progress => {
            this.setSnapshot({ downloadProgress: progress });
        });
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    private async initModel(): Promise<void> {
        try {
            this.setSnapshot({ status: AiSubsystemStatusEnum.READY, errorMessage: null });
        } catch (error: unknown) {
            const message = getErrorMessage(error);
            sttLogger.error('stt:init:throw', { errorMessage: message });
            this.setSnapshot({ status: AiSubsystemStatusEnum.ERROR, errorMessage: message });
            throw error;
        }
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    private async releaseInstance(): Promise<void> {
        try {
            this.instance?.streamStop();
            this.instance?.delete();
            this.instance = null;
            this.activeStream = null;
            this.setSnapshot({
                status: AiSubsystemStatusEnum.SUSPENDED,
                committedTranscription: '',
                nonCommittedTranscription: ''
            });
        } catch (error: unknown) {
            sttLogger.error('stt:stop:error', { errorMessage: getErrorMessage(error) });
            this.instance = null;
            this.activeStream = null;
            this.setSnapshot({ status: AiSubsystemStatusEnum.SUSPENDED });
            throw error;
        }
    }

    streamInsert(waveform: Float32Array | number[]): void {
        this.instance?.streamInsert(waveform);
    }

    protected async runStart(): Promise<void> {
        await this.downloadModel();
        await this.initModel();
    }

    protected async runStop(): Promise<void> {
        await this.releaseInstance();
    }
}

export const sttService = new SttService();
