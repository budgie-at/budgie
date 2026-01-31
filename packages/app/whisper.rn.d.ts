declare module 'whisper.rn' {
    export interface TranscribeRealtimeEvent {
        contextId: number;
        jobId: number;
        isCapturing: boolean;
        isStoppedByAction: boolean;
        code: number;
        processTime: number;
        recordingTime: number;
        data?: {
            result: string;
            segments: Array<{
                t0: number;
                t1: number;
                text: string;
            }>;
        };
        sliceIndex: number;
    }

    export class WhisperContext {
        id: number;
        transcribeRealtime(options: { language?: string; realtimeAudioSec?: number; realtimeAudioSliceSec?: number }): Promise<{
            stop: () => Promise<void>;
            subscribe: (callback: (event: TranscribeRealtimeEvent) => void) => void;
        }>;
        release(): Promise<void>;
    }

    export function initWhisper(options: { filePath: string }): Promise<WhisperContext>;
    export function releaseAllWhisper(): Promise<void>;
}
