export class ManualAudioStreamAdapter {
    /* eslint-disable @typescript-eslint/no-magic-numbers -- PCM-16 signed-integer scale boundaries */
    private static readonly PCM_NEGATIVE_SCALE = 32768;

    private static readonly PCM_POSITIVE_SCALE = 32767;
    /* eslint-enable @typescript-eslint/no-magic-numbers */

    private static readonly PCM_BYTES_PER_SAMPLE = 2;

    private capturedAudioChunks: Uint8Array[] = [];

    private capturedAudioBytes = 0;

    push(samples: Float32Array): void {
        const chunk = this.encodePcm16(samples);

        this.capturedAudioChunks.push(chunk);
        this.capturedAudioBytes += chunk.byteLength;
    }

    getCapturedAudio(): Uint8Array {
        const data = new Uint8Array(this.capturedAudioBytes);
        let offset = 0;

        for (const chunk of this.capturedAudioChunks) {
            data.set(chunk, offset);
            offset += chunk.byteLength;
        }

        return data;
    }

    reset(): void {
        this.capturedAudioChunks = [];
        this.capturedAudioBytes = 0;
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
