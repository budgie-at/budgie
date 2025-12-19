import { AudioRecorder } from 'react-native-audio-api';

export const recordVoice = async (onRecorded: (waveform: number[]) => Promise<void>, durationSeconds = 3, sampleRate = 16000) => {
    const recorder = new AudioRecorder({ sampleRate, bufferLengthInSamples: 4096 });

    recorder.onAudioReady(({ buffer }) => {
        void onRecorded(Array.from(buffer.getChannelData(0)));
    });

    recorder.start();
    await new Promise(resolve => {
        setTimeout(resolve, durationSeconds * 1000);
    });
    recorder.stop();
};
