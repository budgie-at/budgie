import { Log } from '@budgie/logger';
import { WhisperContext, initWhisper, releaseAllWhisper } from 'whisper.rn';

import { emptyFn, getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

import { ManualAudioStreamAdapter } from '../adapter/manual-audio-stream.adapter';
import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { AiNotReadyError } from '../error/ai-not-ready.error';
import { AiSubsystemServiceInterface } from '../interface/ai-subsystem-service.interface';
import { SttSnapshotInterface } from '../interface/stt-snapshot.interface';
import { buildSttTranscribeOptions } from '../util/build-stt-transcribe-options.util';
import { deleteWhisperModel } from '../util/delete-whisper-model.util';
import { downloadWhisperModel } from '../util/download-whisper-model.util';

import { BaseSubsystemService } from './base-subsystem.service';

class SttService extends BaseSubsystemService<SttSnapshotInterface> implements AiSubsystemServiceInterface<SttSnapshotInterface> {
    private context: WhisperContext | null = null;
    private audioStream: ManualAudioStreamAdapter | null = null;
    private resolveStream: ((text: string) => void) | null = null;
    private rejectStream: ((error: unknown) => void) | null = null;
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

    @Log(
        language => `enter language=${language ?? 'default'}`,
        (result, language) => `done language=${language ?? 'default'} committedLen=${result.length}`,
        (error, language) => `throw language=${language ?? 'default'} error=${getErrorMessage(error)}`
    )
    async stream(language: string | null = null): Promise<string> {
        if (!this.isReady || !isDefined(this.context)) {
            throw new AiNotReadyError(AiSubsystemNameEnum.STT);
        }
        if (isDefined(this.audioStream)) {
            await this.stopActiveStream(false).catch(emptyFn);
        }

        return this.startFreshStream(language);
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async retry(): Promise<void> {
        this.resetRetryState();
        await this.start();
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async streamStop(): Promise<void> {
        await this.stopActiveStream(true);
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async streamCancel(): Promise<void> {
        await this.stopActiveStream(false);
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    protected async runStart(): Promise<void> {
        try {
            this.setSnapshot({ status: AiSubsystemStatusEnum.DOWNLOADING, downloadProgress: 0 });
            const modelPath = await downloadWhisperModel(downloadProgress => {
                this.setSnapshot({ downloadProgress });
            });
            this.setSnapshot({ status: AiSubsystemStatusEnum.INITIALIZING });
            this.context = await initWhisper({ filePath: modelPath });
            this.setSnapshot({ status: AiSubsystemStatusEnum.READY, errorMessage: null });
        } catch (error: unknown) {
            this.context = null;
            deleteWhisperModel();
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
            this.clearStreamRefs();
            this.setSnapshot({ status: AiSubsystemStatusEnum.SUSPENDED });
        }
    }

    streamInsert(waveform: Float32Array): void {
        this.audioStream?.push(waveform);
    }

    private resetRetryState(): void {
        this.setSnapshot({ status: AiSubsystemStatusEnum.IDLE, errorMessage: null });
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
            this.resolveStream?.(finalText);

            return finalText;
        } catch (error: unknown) {
            this.rejectStream?.(error);
            throw error;
        } finally {
            this.clearStreamRefs();
        }
    }

    private async transcribeCapturedAudio(audioStream: ManualAudioStreamAdapter): Promise<string> {
        const audioData = audioStream.getCapturedAudio();

        if (!isPositiveNumber(audioData.byteLength)) {
            return '';
        }
        const audioBuffer = new ArrayBuffer(audioData.byteLength);
        new Uint8Array(audioBuffer).set(audioData);
        const { promise } = this.getContext().transcribeData(audioBuffer, buildSttTranscribeOptions(this.streamLanguage));
        const result = await promise;

        return result.result.trim();
    }

    private createStreamPromise(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.resolveStream = resolve;
            this.rejectStream = reject;
        });
    }

    private getContext(): WhisperContext {
        const { context } = this;

        if (!isDefined(context)) {
            throw new AiNotReadyError(AiSubsystemNameEnum.STT);
        }

        return context;
    }

    private startFreshStream(language: string | null): Promise<string> {
        const streamPromise = this.createStreamPromise();

        this.setSnapshot({ errorMessage: null, committedTranscription: '', nonCommittedTranscription: '' });
        this.audioStream = new ManualAudioStreamAdapter();
        this.streamLanguage = language;

        return streamPromise;
    }

    private clearStreamRefs(): void {
        this.streamLanguage = null;
        this.resolveStream = null;
        this.rejectStream = null;
        this.audioStream = null;
    }
}

export const sttService = new SttService();
