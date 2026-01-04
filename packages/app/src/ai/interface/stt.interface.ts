import { SpeechToTextLanguage } from 'react-native-executorch';

interface DecodingOptions {
    language?: SpeechToTextLanguage;
}

export interface SttInterface {
    committedTranscription: string;
    nonCommittedTranscription: string;
    isGenerating: boolean;
    isReady: boolean;
    downloadProgress: number;
    error: string | null;
    stream: (options?: DecodingOptions) => Promise<string>;
    streamInsert: (waveform: Float32Array | number[]) => void;
    streamStop: () => void;
    transcribe: (waveform: Float32Array | number[], options?: DecodingOptions) => Promise<string>;
}
