import { Log } from '@budgie/logger';
import { TranscribeOptions, WhisperContext, initWhisper, releaseAllWhisper } from 'whisper.rn';

import { emptyFn, getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

import { ManualAudioStreamAdapter } from '../adapter/manual-audio-stream.adapter';
import { STT_BEAM_SIZE, STT_MAX_THREADS, STT_MAX_TRANSCRIPTION_LEN, STT_TEMPERATURE } from '../constant/stt-realtime-options.constant';
import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { AiNotReadyError } from '../error/ai-not-ready.error';
import { AiSubsystemServiceInterface } from '../interface/ai-subsystem-service.interface';
import { SttSnapshotInterface } from '../interface/stt-snapshot.interface';

import { BaseSubsystemService } from './base-subsystem.service';
import { whisperModelService } from './whisper-model.service';

class SttService extends BaseSubsystemService<SttSnapshotInterface> implements AiSubsystemServiceInterface<SttSnapshotInterface> {
    private context: WhisperContext | null = null;
    private audioStream: ManualAudioStreamAdapter | null = null;
    private stopStreamPromise: Promise<string> | null = null;
    private streamLanguage: string | null = null;

    constructor() {
        super(AiSubsystemNameEnum.STT, {
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

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async streamStart(language: string | null = null): Promise<void> {
        if (!this.isReady || !isDefined(this.context)) {
            throw new AiNotReadyError(AiSubsystemNameEnum.STT);
        }
        if (isDefined(this.audioStream)) {
            await this.stopActiveStream(false).catch(emptyFn);
        }

        this.setSnapshot({ errorMessage: null, committedTranscription: '', nonCommittedTranscription: '' });
        this.audioStream = new ManualAudioStreamAdapter();
        this.streamLanguage = language;
    }

    @Log('enter', result => `done committedLen=${result.length}`, error => `throw error=${getErrorMessage(error)}`)
    async streamStop(): Promise<string> {
        return this.stopActiveStream(true);
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async streamCancel(): Promise<void> {
        await this.stopActiveStream(false);
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    protected async runStart(): Promise<void> {
        try {
            this.setSnapshot({ status: AiSubsystemStatusEnum.DOWNLOADING, downloadProgress: 0 });
            const modelPath = await whisperModelService.download(downloadProgress => {
                this.setSnapshot({ downloadProgress });
            });
            this.setSnapshot({ status: AiSubsystemStatusEnum.INITIALIZING });
            this.context = await initWhisper({ filePath: modelPath });
            this.setSnapshot({ status: AiSubsystemStatusEnum.READY, errorMessage: null });
        } catch (error: unknown) {
            this.context = null;
            whisperModelService.delete();
            this.setSnapshot({ status: AiSubsystemStatusEnum.ERROR, errorMessage: getErrorMessage(error) });
        }
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    protected async runStop(): Promise<void> {
        try {
            await this.stopActiveStream(false).catch(emptyFn);
            this.context = null;
            await releaseAllWhisper();
            this.setSnapshot({
                status: AiSubsystemStatusEnum.SUSPENDED,
                downloadProgress: 0,
                committedTranscription: '',
                nonCommittedTranscription: ''
            });
        } catch {
            this.context = null;
            this.audioStream = null;
            this.streamLanguage = null;
            this.setSnapshot({ status: AiSubsystemStatusEnum.SUSPENDED });
        }
    }

    streamInsert(waveform: Float32Array): void {
        this.audioStream?.push(waveform);
    }

    protected override async beforeRetry(): Promise<void> {
        await this.streamCancel().catch(emptyFn);
    }

    private stopActiveStream(commitFinalText: boolean): Promise<string> {
        if (isDefined(this.stopStreamPromise)) {
            return this.stopStreamPromise;
        }

        this.stopStreamPromise = this.executeStopActiveStream(commitFinalText).finally(() => {
            this.stopStreamPromise = null;
        });

        return this.stopStreamPromise;
    }

    private async executeStopActiveStream(commitFinalText: boolean): Promise<string> {
        const { audioStream } = this;

        if (!isDefined(audioStream)) {
            return commitFinalText ? this.snapshot.committedTranscription : '';
        }

        try {
            const finalText = commitFinalText ? await this.transcribeCapturedAudio(audioStream) : '';
            this.setSnapshot({ committedTranscription: finalText, nonCommittedTranscription: '' });

            return finalText;
        } finally {
            this.audioStream = null;
            this.streamLanguage = null;
        }
    }

    private async transcribeCapturedAudio(audioStream: ManualAudioStreamAdapter): Promise<string> {
        const audioData = audioStream.getCapturedAudio();

        if (!isPositiveNumber(audioData.byteLength)) {
            return '';
        }
        const audioBuffer = new ArrayBuffer(audioData.byteLength);
        new Uint8Array(audioBuffer).set(audioData);
        const { promise } = this.getContext().transcribeData(audioBuffer, this.buildTranscribeOptions(this.streamLanguage));
        const result = await promise;

        return result.result.trim();
    }

    private buildTranscribeOptions(language: string | null): TranscribeOptions {
        return {
            ...(isDefined(language) && { language }),
            translate: false,
            maxThreads: STT_MAX_THREADS,
            temperature: STT_TEMPERATURE,
            temperatureInc: STT_TEMPERATURE,
            maxLen: STT_MAX_TRANSCRIPTION_LEN,
            beamSize: STT_BEAM_SIZE
        };
    }

    private getContext(): WhisperContext {
        const { context } = this;

        if (!isDefined(context)) {
            throw new AiNotReadyError(AiSubsystemNameEnum.STT);
        }

        return context;
    }
}

export const sttService = new SttService();
