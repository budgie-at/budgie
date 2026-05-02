declare module 'whisper.rn' {
    export interface TranscribeRealtimeEvent {
        readonly contextId: number;
        readonly jobId: number;
        readonly isCapturing: boolean;
        readonly isStoppedByAction?: boolean;
        readonly code: number;
        readonly processTime: number;
        readonly recordingTime: number;
        readonly data?: {
            readonly result: string;
            readonly segments: readonly {
                readonly t0: number;
                readonly t1: number;
                readonly text: string;
            }[];
        };
        readonly sliceIndex: number;
    }

    export interface TranscribeResult {
        readonly result: string;
        readonly language: string;
        readonly isAborted: boolean;
        readonly segments: readonly {
            readonly t0: number;
            readonly t1: number;
            readonly text: string;
        }[];
    }

    export interface TranscribeOptions {
        readonly language?: string;
        readonly maxThreads?: number;
        readonly maxLen?: number;
        readonly temperature?: number;
        readonly temperatureInc?: number;
        readonly beamSize?: number;
        readonly bestOf?: number;
        readonly prompt?: string;
    }

    export class WhisperContext {
        readonly id: number;
        transcribeData(
            data: string | ArrayBuffer,
            options?: TranscribeOptions
        ): {
            readonly stop: () => Promise<void>;
            readonly promise: Promise<TranscribeResult>;
        };
        transcribeRealtime(options: {
            readonly language?: string;
            readonly realtimeAudioSec?: number;
            readonly realtimeAudioSliceSec?: number;
        }): Promise<{
            readonly stop: () => Promise<void>;
            readonly subscribe: (callback: (event: TranscribeRealtimeEvent) => void) => void;
        }>;
        release(): Promise<void>;
    }

    export function initWhisper(options: { readonly filePath: string }): Promise<WhisperContext>;
    export function releaseAllWhisper(): Promise<void>;
}
