 
import type { DecodingOptions } from 'react-native-executorch';

export interface AiSttInterface {
    readonly isReady: boolean;
    readonly downloadProgress: number;
    readonly committedTranscription: string;
    readonly nonCommittedTranscription: string;
    readonly stream: (options?: DecodingOptions) => Promise<string>;
    readonly streamStop: () => void;
    readonly streamInsert: (waveform: number[] | Float32Array) => void;
}
