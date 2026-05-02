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

export class ManualAudioStreamAdapter {
    private capturedAudioChunks: Uint8Array[] = [];

    private capturedAudioBytes = 0;

    push(samples: Float32Array): void {
        const chunk = encodePcm16(samples);

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
}
