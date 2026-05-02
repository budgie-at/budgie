import { Log } from '@budgie/logger';
import { WhisperContext, initWhisper, releaseAllWhisper } from 'whisper.rn';
import { RealtimeTranscriber } from 'whisper.rn/src/realtime-transcription';

import { emptyFn, getErrorMessage, isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { ManualAudioStreamAdapter } from '../adapter/manual-audio-stream.adapter';
import {
    STT_AUDIO_STREAM_CONFIG,
    STT_REALTIME_AUDIO_MIN_SEC,
    STT_REALTIME_AUDIO_SLICE_SEC,
    STT_REALTIME_MAX_SLICES_IN_MEMORY
} from '../constant/stt-realtime-options.constant';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { AiNotReadyError } from '../error/ai-not-ready.error';
import { AiSubsystemServiceInterface } from '../interface/ai-subsystem-service.interface';
import { SttSnapshotInterface } from '../interface/stt-snapshot.interface';
import { buildSttTranscribeOptions } from '../util/build-stt-transcribe-options.util';
import { copyAudioDataToBuffer } from '../util/copy-audio-data-to-buffer.util';
import { deleteWhisperModel } from '../util/delete-whisper-model.util';
import { downloadWhisperModel } from '../util/download-whisper-model.util';

import { BaseSubsystemService } from './base-subsystem.service';

import type { SttStreamOptionsInterface } from '../interface/stt-stream-options.interface';
import type { RealtimeTranscribeEvent } from 'whisper.rn/src/realtime-transcription';

class SttService extends BaseSubsystemService<SttSnapshotInterface> implements AiSubsystemServiceInterface<SttSnapshotInterface> {
    private context: WhisperContext | null = null;
    private audioStream: ManualAudioStreamAdapter | null = null;
    private realtimeTranscriber: RealtimeTranscriber | null = null;
    private resolveStream: ((text: string) => void) | null = null;
    private rejectStream: ((error: unknown) => void) | null = null;
    private stopStreamPromise: Promise<string> | null = null;
    private shouldCommitActiveStream = false;
    private streamOptions: SttStreamOptionsInterface | null = null;

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

    private async stopAudioStream(audioStream: ManualAudioStreamAdapter, realtimeTranscriber: RealtimeTranscriber): Promise<string> {
        await realtimeTranscriber.stop();

        try {
            return await this.resolveStoppedAudioStream(audioStream);
        } finally {
            await realtimeTranscriber.release();
        }
    }

    private async resolveStoppedAudioStream(audioStream: ManualAudioStreamAdapter): Promise<string> {
        if (!this.shouldCommitActiveStream) {
            return this.discardFinalState();
        }

        return this.transcribeCapturedAudio(audioStream);
    }

    private async transcribeCapturedAudio(audioStream: ManualAudioStreamAdapter): Promise<string> {
        const audioData = audioStream.getCapturedAudio();

        if (!isPositiveNumber(audioData.byteLength)) {
            return this.commitFinalState();
        }
        const finalText = await this.transcribeAudioData(this.getContext(), audioData, this.streamOptions);

        this.setSnapshot({ committedTranscription: finalText, nonCommittedTranscription: '' });

        return this.commitFinalState();
    }

    private async transcribeAudioData(
        context: WhisperContext,
        audioData: Uint8Array,
        options: SttStreamOptionsInterface | null
    ): Promise<string> {
        const audioBuffer = copyAudioDataToBuffer(audioData);
        const { promise } = context.transcribeData(audioBuffer, buildSttTranscribeOptions(options));
        const result = await promise;

        return result.result.trim();
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
        const { realtimeTranscriber } = this;

        if (!isDefined(audioStream) || !isDefined(realtimeTranscriber)) {
            return this.shouldCommitActiveStream ? this.snapshot.committedTranscription : '';
        }

        try {
            const finalText = await this.stopAudioStream(audioStream, realtimeTranscriber);
            this.resolveStream?.(this.shouldCommitActiveStream ? finalText : '');

            return finalText;
        } catch (error: unknown) {
            this.rejectStream?.(error);
            throw error;
        } finally {
            this.clearStreamRefs();
        }
    }

    private createStreamPromise(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.resolveStream = resolve;
            this.rejectStream = reject;
        });
    }

    private getRealtimeTranscription(event: RealtimeTranscribeEvent): string | null {
        if (event.type !== 'transcribe') {
            return null;
        }
        const text = event.data?.result.trim() ?? '';

        return isNotEmptyString(text) ? text : null;
    }

    private handleRealtimeTranscribe(event: RealtimeTranscribeEvent): void {
        const text = this.getRealtimeTranscription(event);

        if (!isDefined(text)) {
            return;
        }

        this.setSnapshot({ nonCommittedTranscription: text });
    }

    private getContext(): WhisperContext {
        const { context } = this;

        if (!isDefined(context)) {
            throw new AiNotReadyError('stt');
        }

        return context;
    }

    private createRealtimeTranscriber(audioStream: ManualAudioStreamAdapter, options?: SttStreamOptionsInterface): RealtimeTranscriber {
        return new RealtimeTranscriber(
            { whisperContext: this.getContext(), audioStream },
            {
                audioMinSec: STT_REALTIME_AUDIO_MIN_SEC,
                audioSliceSec: STT_REALTIME_AUDIO_SLICE_SEC,
                audioStreamConfig: STT_AUDIO_STREAM_CONFIG,
                maxSlicesInMemory: STT_REALTIME_MAX_SLICES_IN_MEMORY,
                transcribeOptions: buildSttTranscribeOptions(options ?? null)
            },
            {
                onError: error => this.rejectStream?.(error),
                onTranscribe: event => void this.handleRealtimeTranscribe(event)
            }
        );
    }

    private async startFreshStream(options?: SttStreamOptionsInterface): Promise<string> {
        const streamPromise = this.createStreamPromise();
        const audioStream = new ManualAudioStreamAdapter();
        const realtimeTranscriber = this.createRealtimeTranscriber(audioStream, options);

        this.setSnapshot({ errorMessage: null, committedTranscription: '', nonCommittedTranscription: '' });
        this.audioStream = audioStream;
        this.realtimeTranscriber = realtimeTranscriber;
        this.streamOptions = options ?? null;
        await realtimeTranscriber.start().catch((error: unknown) => {
            this.clearStreamRefs();
            throw error;
        });

        return streamPromise;
    }

    private clearStreamRefs(): void {
        this.resolveStream = null;
        this.rejectStream = null;
        this.audioStream = null;
        this.realtimeTranscriber = null;
        this.streamOptions = null;
    }
}

export const sttService = new SttService();
