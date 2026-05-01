declare module 'whisper.rn/realtime-transcription' {
    export interface AudioStreamData {
        readonly data: Uint8Array;
        readonly sampleRate: number;
        readonly channels: number;
        readonly timestamp: number;
    }

    export interface AudioStreamConfig {
        readonly sampleRate?: number;
        readonly channels?: number;
        readonly bitsPerSample?: number;
        readonly bufferSize?: number;
        readonly audioSource?: number;
    }

    export interface AudioStreamInterface {
        initialize(config: AudioStreamConfig): Promise<void>;
        start(): Promise<void>;
        stop(): Promise<void>;
        isRecording(): boolean;
        onData(callback: (data: AudioStreamData) => void): void;
        onError(callback: (error: string) => void): void;
        onStatusChange(callback: (isRecording: boolean) => void): void;
        release(): Promise<void>;
    }

    export interface RealtimeTranscribeEvent {
        readonly type: 'start' | 'transcribe' | 'end' | 'error';
        readonly sliceIndex: number;
        readonly data?: { readonly result?: string };
        readonly isCapturing: boolean;
        readonly processTime: number;
        readonly recordingTime: number;
        readonly memoryUsage?: {
            readonly slicesInMemory: number;
            readonly totalSamples: number;
            readonly estimatedMB: number;
        };
    }

    export interface RealtimeTranscriberResultEntry {
        readonly slice: { readonly index: number };
        readonly transcribeEvent: RealtimeTranscribeEvent;
    }

    export class RealtimeTranscriber {
        constructor(
            dependencies: { readonly whisperContext: unknown; readonly audioStream: AudioStreamInterface },
            options?: {
                readonly audioSliceSec?: number;
                readonly audioMinSec?: number;
                readonly maxSlicesInMemory?: number;
                readonly promptPreviousSlices?: boolean;
                readonly audioStreamConfig?: AudioStreamConfig;
                readonly transcribeOptions?: { readonly language?: string };
            },
            callbacks?: {
                readonly onTranscribe?: (event: RealtimeTranscribeEvent) => void;
                readonly onError?: (error: string) => void;
            }
        );

        start(): Promise<void>;
        stop(): Promise<void>;
        nextSlice(): Promise<void>;
        getTranscriptionResults(): RealtimeTranscriberResultEntry[];
    }
}
