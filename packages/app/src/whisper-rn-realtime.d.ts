declare module 'whisper.rn/src/realtime-transcription' {
    import type { TranscribeOptions, TranscribeResult } from 'whisper.rn';

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
        readonly data?: TranscribeResult;
        readonly isCapturing: boolean;
        readonly processTime: number;
        readonly recordingTime: number;
        readonly memoryUsage?: {
            readonly slicesInMemory: number;
            readonly totalSamples: number;
            readonly estimatedMB: number;
        };
    }

    export interface RealtimeOptions {
        readonly audioSliceSec?: number;
        readonly audioMinSec?: number;
        readonly maxSlicesInMemory?: number;
        readonly transcribeOptions?: TranscribeOptions;
        readonly initialPrompt?: string;
        readonly promptPreviousSlices?: boolean;
        readonly audioStreamConfig?: AudioStreamConfig;
        readonly logger?: (message: string) => void;
    }

    export interface RealtimeTranscriberCallbacks {
        readonly onTranscribe?: (event: RealtimeTranscribeEvent) => void;
        readonly onError?: (error: string) => void;
        readonly onStatusChange?: (isActive: boolean) => void;
    }

    export interface WhisperContextLike {
        transcribeData(
            data: ArrayBuffer,
            options: TranscribeOptions
        ): {
            readonly stop: () => Promise<void>;
            readonly promise: Promise<TranscribeResult>;
        };
    }

    export interface RealtimeTranscriberDependencies {
        readonly whisperContext: WhisperContextLike;
        readonly audioStream: AudioStreamInterface;
    }

    export class RealtimeTranscriber {
        constructor(dependencies: RealtimeTranscriberDependencies, options?: RealtimeOptions, callbacks?: RealtimeTranscriberCallbacks);
        start(): Promise<void>;
        stop(): Promise<void>;
        release(): Promise<void>;
        getTranscriptionResults(): {
            readonly transcribeEvent: RealtimeTranscribeEvent;
        }[];
    }
}
