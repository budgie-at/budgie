import { isDefined } from '@rnw-community/shared';

export class ManualAudioStreamAdapter {
    /* eslint-disable @typescript-eslint/no-magic-numbers -- PCM-16 signed-integer scale boundaries and silence-trim window sizing in samples at 16 kHz */
    private static readonly PCM_NEGATIVE_SCALE = 32768;

    private static readonly PCM_POSITIVE_SCALE = 32767;

    private static readonly PCM_BYTES_PER_SAMPLE = 2;

    private static readonly TRIM_WINDOW_SAMPLES = 320;

    private static readonly TRIM_RMS_THRESHOLD = 0.01;

    private static readonly TRIM_PADDING_WINDOWS = 3;

    private static readonly MIN_SPEECH_SAMPLES = 6400;
    /* eslint-enable @typescript-eslint/no-magic-numbers */

    private capturedChunks: Float32Array[] = [];

    private capturedSampleCount = 0;

    push(samples: Float32Array): void {
        const snapshot = new Float32Array(samples);
        this.capturedChunks.push(snapshot);
        this.capturedSampleCount += snapshot.length;
    }

    getCapturedAudio(): Uint8Array {
        const merged = this.mergeChunks();
        const trimmed = this.trimSilence(merged);

        if (trimmed.length < ManualAudioStreamAdapter.MIN_SPEECH_SAMPLES) {
            return new Uint8Array(0);
        }

        return this.encodePcm16(trimmed);
    }

    reset(): void {
        this.capturedChunks = [];
        this.capturedSampleCount = 0;
    }

    private mergeChunks(): Float32Array {
        const merged = new Float32Array(this.capturedSampleCount);
        let offset = 0;

        for (const chunk of this.capturedChunks) {
            merged.set(chunk, offset);
            offset += chunk.length;
        }

        return merged;
    }

    private trimSilence(samples: Float32Array): Float32Array {
        const windowSize = ManualAudioStreamAdapter.TRIM_WINDOW_SAMPLES;
        const padding = ManualAudioStreamAdapter.TRIM_PADDING_WINDOWS;
        const windowCount = Math.floor(samples.length / windowSize);
        const bounds = this.findActiveWindowBounds(samples, windowCount);

        if (!isDefined(bounds)) {
            return new Float32Array(0);
        }

        const startSample = Math.max(0, bounds.first - padding) * windowSize;
        const endSample = Math.min(windowCount, bounds.last + padding + 1) * windowSize;

        return samples.slice(startSample, endSample);
    }

    private findActiveWindowBounds(samples: Float32Array, windowCount: number): { first: number; last: number } | null {
        const windowSize = ManualAudioStreamAdapter.TRIM_WINDOW_SAMPLES;
        const threshold = ManualAudioStreamAdapter.TRIM_RMS_THRESHOLD;
        let first = -1;
        let last = -1;

        for (let windowIndex = 0; windowIndex < windowCount; windowIndex += 1) {
            const rms = this.computeWindowRms(samples, windowIndex * windowSize, windowSize);
            if (rms >= threshold) {
                if (first === -1) {
                    first = windowIndex;
                }
                last = windowIndex;
            }
        }

        return first === -1 ? null : { first, last };
    }

    private computeWindowRms(samples: Float32Array, offset: number, windowSize: number): number {
        let sumSquares = 0;
        for (let sampleIndex = 0; sampleIndex < windowSize; sampleIndex += 1) {
            const sample = samples[offset + sampleIndex];
            sumSquares += sample * sample;
        }

        return Math.sqrt(sumSquares / windowSize);
    }

    private encodePcm16(samples: Float32Array): Uint8Array {
        const buffer = new ArrayBuffer(samples.length * ManualAudioStreamAdapter.PCM_BYTES_PER_SAMPLE);
        const view = new DataView(buffer);

        for (const [index, sample] of samples.entries()) {
            const offset = index * ManualAudioStreamAdapter.PCM_BYTES_PER_SAMPLE;
            view.setInt16(offset, this.clampPcmSample(sample), true);
        }

        return new Uint8Array(buffer);
    }

    private clampPcmSample(sample: number): number {
        const clamped = Math.max(-1, Math.min(1, sample));

        return clamped < 0
            ? Math.round(clamped * ManualAudioStreamAdapter.PCM_NEGATIVE_SCALE)
            : Math.round(clamped * ManualAudioStreamAdapter.PCM_POSITIVE_SCALE);
    }
}
