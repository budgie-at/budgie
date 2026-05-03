export interface SttInvokerInterface {
    readonly isReady: boolean;
    readonly committedTranscription: string;
    readonly nonCommittedTranscription: string;
    stream(options?: { readonly language?: string }): Promise<string>;
    streamStop(): Promise<void>;
    streamCancel(): Promise<void>;
    streamInsert(waveform: Float32Array): void;
}
