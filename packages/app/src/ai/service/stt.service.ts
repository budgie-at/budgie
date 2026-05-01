import { BUFFER_LENGTH, SAMPLE_RATE } from '@budgie/ai';
import { Log } from '@budgie/logger';
import { t } from '@lingui/core/macro';
import { WhisperContext, initWhisper, releaseAllWhisper } from 'whisper.rn';
import { RealtimeTranscribeEvent, RealtimeTranscriber } from 'whisper.rn/realtime-transcription';

import { emptyFn, getErrorMessage, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { ManualAudioStreamAdapter } from '../adapter/manual-audio-stream.adapter';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { AiNotReadyError } from '../error/ai-not-ready.error';
import { AiSubsystemServiceInterface } from '../interface/ai-subsystem-service.interface';
import { SttSnapshotInterface } from '../interface/stt-snapshot.interface';
import { deleteWhisperModel } from '../util/delete-whisper-model.util';
import { downloadWhisperModel } from '../util/download-whisper-model.util';

import { BaseSubsystemService } from './base-subsystem.service';

import type { SttInvokerInterface } from '@budgie/ai';

class SttService
    extends BaseSubsystemService<SttSnapshotInterface>
    implements AiSubsystemServiceInterface<SttSnapshotInterface>, SttInvokerInterface
{
    private static readonly AUDIO_SLICE_SEC = 3;

    private static readonly AUDIO_MIN_SEC = 0.5;

    private static readonly MAX_SLICES_IN_MEMORY = 2;

    private static readonly AUDIO_STREAM_CONFIG = {
        sampleRate: SAMPLE_RATE,
        channels: 1,
        bitsPerSample: 16,
        bufferSize: BUFFER_LENGTH * 5 * 2
    } as const;

    private context: WhisperContext | null = null;

    private transcriber: RealtimeTranscriber | null = null;

    private audioStream: ManualAudioStreamAdapter | null = null;

    private resolveStream: ((text: string) => void) | null = null;

    private rejectStream: ((error: unknown) => void) | null = null;

    private stopStreamPromise: Promise<string> | null = null;

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

    get nonCommittedTranscription(): string {
        return this.snapshot.nonCommittedTranscription;
    }

    @Log(
        options => `enter language=${options?.language ?? 'default'}`,
        (result, options) => `done language=${options?.language ?? 'default'} committedLen=${result.length}`,
        (error, options) => `throw language=${options?.language ?? 'default'} error=${getErrorMessage(error)}`
    )
    async stream(options?: { readonly language?: string }): Promise<string> {
        if (!this.isReady || !isDefined(this.context)) {
            throw new AiNotReadyError('stt');
        }
        if (isDefined(this.transcriber)) {
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

    private aggregateTranscription(transcriber: RealtimeTranscriber | null): string {
        return (
            transcriber
                ?.getTranscriptionResults()
                .sort((left, right) => left.slice.index - right.slice.index)
                .map(result => result.transcribeEvent.data?.result?.trim() ?? '')
                .filter(isNotEmptyString)
                .join(' ')
                .trim() ?? ''
        );
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

    private async stopTranscriber(
        transcriber: RealtimeTranscriber,
        audioStream: ManualAudioStreamAdapter | null,
        commitFinalText: boolean
    ): Promise<string> {
        if (audioStream?.isRecording() ?? false) {
            await transcriber.nextSlice();
        }

        await transcriber.stop();
        await audioStream?.release();

        return commitFinalText ? this.commitFinalState() : this.discardFinalState();
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
        const { transcriber } = this;
        const { audioStream } = this;

        if (!isDefined(transcriber)) {
            return commitFinalText ? this.snapshot.committedTranscription : '';
        }

        try {
            const finalText = await this.stopTranscriber(transcriber, audioStream, commitFinalText);
            this.resolveStream?.(commitFinalText ? finalText : '');

            return finalText;
        } catch (error: unknown) {
            this.rejectStream?.(error);
            throw error;
        } finally {
            this.clearStreamRefs();
        }
    }

    private async startFreshStream(options?: { readonly language?: string }): Promise<string> {
        this.streamId += 1;
        const { streamId } = this;

        this.setSnapshot({
            errorMessage: null,
            committedTranscription: '',
            nonCommittedTranscription: ''
        });

        const audioStream = new ManualAudioStreamAdapter();
        const transcriber = new RealtimeTranscriber(
            { whisperContext: this.context, audioStream },
            {
                audioSliceSec: SttService.AUDIO_SLICE_SEC,
                audioMinSec: SttService.AUDIO_MIN_SEC,
                maxSlicesInMemory: SttService.MAX_SLICES_IN_MEMORY,
                promptPreviousSlices: true,
                audioStreamConfig: SttService.AUDIO_STREAM_CONFIG,
                transcribeOptions: { ...(isDefined(options?.language) && { language: options.language }) }
            },
            {
                onTranscribe: event => void this.handleTranscribe(event, streamId),
                onError: error => void this.handleTranscribeError(error, streamId)
            }
        );

        this.audioStream = audioStream;
        this.transcriber = transcriber;

        try {
            await transcriber.start();
        } catch (error: unknown) {
            this.clearStreamRefs();
            throw error;
        }

        return new Promise<string>((resolve, reject) => {
            this.resolveStream = resolve;
            this.rejectStream = reject;
        });
    }

    private handleTranscribe(event: RealtimeTranscribeEvent, streamId: number): void {
        if (streamId !== this.streamId) {
            return;
        }
        if (event.type === 'transcribe') {
            const committedTranscription = this.aggregateTranscription(this.transcriber);
            const eventTranscription = event.data?.result?.trim() ?? '';
            const nonCommittedTranscription =
                isNotEmptyString(eventTranscription) && !committedTranscription.endsWith(eventTranscription) ? eventTranscription : '';

            this.setSnapshot({
                committedTranscription,
                nonCommittedTranscription
            });
        }
        if (event.type === 'error') {
            this.setSnapshot({ errorMessage: t`Whisper transcription failed` });
        }
    }

    private handleTranscribeError(errorMessage: string, streamId: number): void {
        if (streamId !== this.streamId) {
            return;
        }

        this.setSnapshot({ errorMessage });
    }

    private clearStreamRefs(): void {
        this.resolveStream = null;
        this.rejectStream = null;
        this.transcriber = null;
        this.audioStream = null;
    }
}

export const sttService = new SttService();
