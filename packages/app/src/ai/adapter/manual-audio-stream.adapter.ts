import type { AudioStreamConfig, AudioStreamData, AudioStreamInterface } from 'whisper.rn/realtime-transcription';

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
    private config: AudioStreamConfig = {};

    private dataCallback: ((data: AudioStreamData) => void) | null = null;

    private errorCallback: ((error: string) => void) | null = null;

    private statusCallback: ((isRecording: boolean) => void) | null = null;

    private initialized = false;

    private recording = false;

    async initialize(config: AudioStreamConfig): Promise<void> {
        this.config = config;
        this.initialized = true;
    }

    async start(): Promise<void> {
        if (!this.initialized) {
            // eslint-disable-next-line lingui/no-unlocalized-strings
            throw new Error('Audio stream not initialized');
        }

        this.recording = true;
        this.statusCallback?.(true);
    }

    async stop(): Promise<void> {
        if (!this.recording) {
            return;
        }

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
        this.dataCallback = null;
        this.errorCallback = null;
        this.statusCallback = null;
    }

    push(samples: Float32Array): void {
        if (!this.recording) {
            return;
        }

        try {
            this.dataCallback?.({
                data: encodePcm16(samples),
                sampleRate: this.config.sampleRate ?? 16000,
                channels: this.config.channels ?? 1,
                timestamp: Date.now()
            });
        } catch (error) {
            // eslint-disable-next-line lingui/no-unlocalized-strings
            const message = error instanceof Error ? error.message : 'Failed to process audio chunk';
            this.errorCallback?.(message);
        }
    }
}
