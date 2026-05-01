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

    export class WhisperContext {
        readonly id: number;
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
