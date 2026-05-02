import { t } from '@lingui/core/macro';

import { getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import type { AudioStreamConfig, AudioStreamData, AudioStreamInterface } from 'whisper.rn/src/realtime-transcription';

const PCM_NEGATIVE_SCALE = 32768;
const PCM_POSITIVE_SCALE = 32767;
const PCM_BYTES_PER_SAMPLE = 2;

const clampPcmSample = (sample: number): number => {
    const clamped = Math.max(-1, Math.min(1, sample));

    return clamped < 0 ? Math.round(clamped * PCM_NEGATIVE_SCALE) : Math.round(clamped * PCM_POSITIVE_SCALE);
};

const encodePcm16 = (samples: Float32Array): Uint8Array => {
    const buffer = new ArrayBuffer(samples.length * PCM_BYTES_PER_SAMPLE);
    const view = new DataView(buffer);

    for (const [index, sample] of samples.entries()) {
        const pcmValue = clampPcmSample(sample);
        const offset = index * PCM_BYTES_PER_SAMPLE;

        view.setInt16(offset, pcmValue, true);
    }

    return new Uint8Array(buffer);
};

export class ManualAudioStreamAdapter implements AudioStreamInterface {
    private static readonly DEFAULT_SAMPLE_RATE = 16000;

    private static readonly DEFAULT_CHANNELS = 1;

    private static readonly DEFAULT_BUFFER_SIZE = 16000;

    private static readonly MAX_PENDING_AUDIO_SEC = 2;

    private config: AudioStreamConfig = {};

    private dataCallback: ((data: AudioStreamData) => void) | null = null;

    private errorCallback: ((error: string) => void) | null = null;

    private statusCallback: ((isRecording: boolean) => void) | null = null;

    private initialized = false;

    private recording = false;

    private pendingAudioChunks: Uint8Array[] = [];

    private pendingAudioBytes = 0;

    async initialize(config: AudioStreamConfig): Promise<void> {
        this.config = config;
        this.initialized = true;
    }

    async start(): Promise<void> {
        if (!this.initialized) {
            throw new Error(t`Audio stream not initialized`);
        }

        this.recording = true;
        this.statusCallback?.(true);
    }

    async stop(): Promise<void> {
        if (!this.recording) {
            return;
        }

        this.flushPendingAudio();
        this.recording = false;
        this.statusCallback?.(false);
    }

    isRecording(): boolean {
        return this.recording;
    }

    onData(callback: (data: AudioStreamData) => void): void {
        this.dataCallback = callback;
    }

    onError(callback: (error: string) => void): void {
        this.errorCallback = callback;
    }

    onStatusChange(callback: (isRecording: boolean) => void): void {
        this.statusCallback = callback;
    }

    async release(): Promise<void> {
        await this.stop();
        this.initialized = false;
        this.clearPendingAudio();
        this.dataCallback = null;
        this.errorCallback = null;
        this.statusCallback = null;
    }

    push(samples: Float32Array): void {
        if (!this.recording) {
            return;
        }

        try {
            this.enqueueAudioChunk(encodePcm16(samples));
        } catch (error) {
            this.errorCallback?.(getErrorMessage(error));
        }
    }

    private enqueueAudioChunk(chunk: Uint8Array): void {
        this.pendingAudioChunks.push(chunk);
        this.pendingAudioBytes += chunk.byteLength;
        this.trimPendingAudio();

        if (this.pendingAudioBytes >= this.getFlushByteSize()) {
            this.flushPendingAudio();
        }
    }

    private trimPendingAudio(): void {
        const maxPendingBytes = this.getMaxPendingBytes();

        while (this.pendingAudioBytes > maxPendingBytes && isNotEmptyArray(this.pendingAudioChunks)) {
            const chunk = this.pendingAudioChunks.shift();

            if (isDefined(chunk)) {
                this.pendingAudioBytes -= chunk.byteLength;
            }
        }
    }

    private flushPendingAudio(): void {
        if (this.pendingAudioBytes === 0) {
            return;
        }

        this.dataCallback?.({
            data: this.buildPendingAudio(),
            sampleRate: this.getSampleRate(),
            channels: this.getChannels(),
            timestamp: Date.now()
        });
        this.clearPendingAudio();
    }

    private buildPendingAudio(): Uint8Array {
        const data = new Uint8Array(this.pendingAudioBytes);
        let offset = 0;

        for (const chunk of this.pendingAudioChunks) {
            data.set(chunk, offset);
            offset += chunk.byteLength;
        }

        return data;
    }

    private clearPendingAudio(): void {
        this.pendingAudioChunks = [];
        this.pendingAudioBytes = 0;
    }

    private getFlushByteSize(): number {
        return this.config.bufferSize ?? ManualAudioStreamAdapter.DEFAULT_BUFFER_SIZE;
    }

    private getMaxPendingBytes(): number {
        return this.getSampleRate() * this.getChannels() * PCM_BYTES_PER_SAMPLE * ManualAudioStreamAdapter.MAX_PENDING_AUDIO_SEC;
    }

    private getSampleRate(): number {
        return this.config.sampleRate ?? ManualAudioStreamAdapter.DEFAULT_SAMPLE_RATE;
    }

    private getChannels(): number {
        return this.config.channels ?? ManualAudioStreamAdapter.DEFAULT_CHANNELS;
    }
}
