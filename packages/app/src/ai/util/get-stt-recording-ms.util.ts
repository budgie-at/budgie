import { STT_AUDIO_STREAM_CONFIG } from '../constant/stt-realtime-options.constant';

export const getSttRecordingMs = (audioData: Uint8Array): number =>
    Math.round(
        (audioData.byteLength /
            STT_AUDIO_STREAM_CONFIG.sampleRate /
            STT_AUDIO_STREAM_CONFIG.channels /
            (STT_AUDIO_STREAM_CONFIG.bitsPerSample / 8)) *
            1000
    );
