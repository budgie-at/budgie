import { Log, getLogger } from '@budgie/logger';
import { WhisperContext, initWhisper, releaseAllWhisper } from 'whisper.rn';

import { emptyFn, getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

import { ManualAudioStreamAdapter } from '../adapter/manual-audio-stream.adapter';
import { STT_AUDIO_STREAM_CONFIG } from '../constant/stt-realtime-options.constant';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { AiNotReadyError } from '../error/ai-not-ready.error';
import { AiSubsystemServiceInterface } from '../interface/ai-subsystem-service.interface';
import { SttSnapshotInterface } from '../interface/stt-snapshot.interface';
import { buildSttTranscribeOptions } from '../util/build-stt-transcribe-options.util';
import { copyAudioDataToBuffer } from '../util/copy-audio-data-to-buffer.util';
import { deleteWhisperModel } from '../util/delete-whisper-model.util';
import { downloadWhisperModel } from '../util/download-whisper-model.util';
import { getSttRecordingMs } from '../util/get-stt-recording-ms.util';

import { BaseSubsystemService } from './base-subsystem.service';

import type { SttStreamOptionsInterface } from '../interface/stt-stream-options.interface';

const logger = getLogger('SttService');

class SttService extends BaseSubsystemService<SttSnapshotInterface> implements AiSubsystemServiceInterface<SttSnapshotInterface> {
    private context: WhisperContext | null = null;

    private audioStream: ManualAudioStreamAdapter | null = null;

    private resolveStream: ((text: string) => void) | null = null;

    private rejectStream: ((error: unknown) => void) | null = null;

    private stopStreamPromise: Promise<string> | null = null;

    private shouldCommitActiveStream = false;

    private streamOptions: SttStreamOptionsInterface | null = null;

    private streamId = 0;

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

    @Log(
        options => `enter language=${options?.language ?? 'default'}`,
        (result, options) => `done language=${options?.language ?? 'default'} committedLen=${result.length}`,
        (error, options) => `throw language=${options?.language ?? 'default'} error=${getErrorMessage(error)}`
    )
    async stream(options?: SttStreamOptionsInterface): Promise<string> {
        if (!this.isReady || !isDefined(this.context)) {
            throw new AiNotReadyError('stt');
        }
        if (isDefined(this.audioStream)) {
            await this.stopActiveStream(false).catch(emptyFn);
        }

        return this.startFreshStream(options);
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

    streamInsert(waveform: Float32Array): void {
        this.audioStream?.push(waveform);
    }

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
        } catch (error: unknown) {
            this.context = null;
            this.clearStreamRefs();
            this.setSnapshot({ status: AiSubsystemStatusEnum.SUSPENDED });
            throw error;
        }
    }

    private resetRetryState(): void {
        this.setSnapshot({ status: AiSubsystemStatusEnum.IDLE, errorMessage: null });
    }

    private commitFinalState(): string {
        const finalText = this.snapshot.committedTranscription.trim();
        this.setSnapshot({ committedTranscription: finalText, nonCommittedTranscription: '' });

        return finalText;
    }

    private discardFinalState(): string {
        this.setSnapshot({ committedTranscription: '', nonCommittedTranscription: '' });

        return '';
    }

    private getContext(): WhisperContext {
        const { context } = this;

        if (!isDefined(context)) {
            throw new AiNotReadyError('stt');
        }

        return context;
    }

    private async transcribeCapturedAudio(audioData: Uint8Array, options: SttStreamOptionsInterface | null): Promise<string> {
        const context = this.getContext();
        const audioBuffer = copyAudioDataToBuffer(audioData);
        const startedAt = Date.now();
        const { promise } = context.transcribeData(audioBuffer, buildSttTranscribeOptions(options));
        const result = await promise;
        const processMs = Date.now() - startedAt;
        const text = result.result.trim();

        logger.log('transcribe:final:done', {
            streamId: this.streamId,
            language: options?.language ?? 'default',
            textPreview: text.slice(0, 80),
            textLen: text.length,
            processMs
        });

        return text;
    }

    private async releaseWithoutCommit(audioStream: ManualAudioStreamAdapter): Promise<string> {
        await audioStream.release();

        return this.discardFinalState();
    }

    private async releaseWithCommit(audioStream: ManualAudioStreamAdapter): Promise<string> {
        await audioStream.release();

        return this.commitFinalState();
    }

    private async stopAudioStream(audioStream: ManualAudioStreamAdapter): Promise<string> {
        await audioStream.stop();

        if (!this.shouldCommitActiveStream) {
            return this.releaseWithoutCommit(audioStream);
        }

        const audioData = audioStream.getCapturedAudio();
        const recordingMs = getSttRecordingMs(audioData);

        logger.log('transcribe:final:start', {
            streamId: this.streamId,
            language: this.streamOptions?.language ?? 'default',
            audioBytes: audioData.byteLength,
            recordingMs
        });

        if (!isPositiveNumber(audioData.byteLength)) {
            return this.releaseWithCommit(audioStream);
        }

        const finalText = await this.transcribeCapturedAudio(audioData, this.streamOptions);

        this.setSnapshot({ committedTranscription: finalText, nonCommittedTranscription: '' });

        return this.releaseWithCommit(audioStream);
    }

    private stopActiveStream(commitFinalText: boolean): Promise<string> {
        if (!commitFinalText) {
            this.shouldCommitActiveStream = false;
        }
        if (isDefined(this.stopStreamPromise)) {
            return this.stopStreamPromise;
        }

        this.shouldCommitActiveStream = commitFinalText;
        this.stopStreamPromise = this.executeStopActiveStream().finally(() => {
            this.stopStreamPromise = null;
            this.shouldCommitActiveStream = false;
        });

        return this.stopStreamPromise;
    }

    private async executeStopActiveStream(): Promise<string> {
        const { audioStream } = this;

        if (!isDefined(audioStream)) {
            return this.shouldCommitActiveStream ? this.snapshot.committedTranscription : '';
        }

        try {
            const finalText = await this.stopAudioStream(audioStream);
            this.resolveStream?.(this.shouldCommitActiveStream ? finalText : '');

            return finalText;
        } catch (error: unknown) {
            this.rejectStream?.(error);
            throw error;
        } finally {
            this.clearStreamRefs();
        }
    }

    private resetStreamSnapshot(): void {
        this.setSnapshot({
            errorMessage: null,
            committedTranscription: '',
            nonCommittedTranscription: ''
        });
    }

    private createStreamPromise(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.resolveStream = resolve;
            this.rejectStream = reject;
        });
    }

    private async startAudioStream(
        audioStream: ManualAudioStreamAdapter,
        streamId: number,
        options?: SttStreamOptionsInterface
    ): Promise<void> {
        await audioStream.initialize(STT_AUDIO_STREAM_CONFIG);
        await audioStream.start();
        logger.log('stream:collector:start', { streamId, language: options?.language ?? 'default' });
    }

    private async startFreshStream(options?: SttStreamOptionsInterface): Promise<string> {
        this.streamId += 1;
        const { streamId } = this;
        const streamPromise = this.createStreamPromise();
        const audioStream = new ManualAudioStreamAdapter();

        this.resetStreamSnapshot();
        this.audioStream = audioStream;
        this.streamOptions = options ?? null;
        await this.startAudioStream(audioStream, streamId, options).catch((error: unknown) => {
            this.clearStreamRefs();
            throw error;
        });

        return streamPromise;
    }

    private clearStreamRefs(): void {
        this.resolveStream = null;
        this.rejectStream = null;
        this.audioStream = null;
        this.streamOptions = null;
    }
}

export const sttService = new SttService();
