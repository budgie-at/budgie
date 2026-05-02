import { BUFFER_LENGTH, SAMPLE_RATE } from '@budgie/ai';

export const STT_MAX_THREADS = 4;

export const STT_MAX_TRANSCRIPTION_LEN = 80;

export const STT_TEMPERATURE = 0;

export const STT_BEAM_SIZE = 1;

export const STT_AUDIO_STREAM_CONFIG = {
    sampleRate: SAMPLE_RATE,
    channels: 1,
    bitsPerSample: 16,
    bufferSize: BUFFER_LENGTH * 10
} as const;
