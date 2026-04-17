export interface SttInvokerInterface {
    readonly isReady: boolean;
    readonly committedTranscription: string;
    readonly nonCommittedTranscription: string;
    stream(options?: { readonly language?: string }): Promise<string>;
    streamStop(): void;
    streamInsert(waveform: Float32Array | number[]): void;
}
