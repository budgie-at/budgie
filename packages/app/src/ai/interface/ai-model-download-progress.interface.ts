export interface AiModelDownloadProgressInterface {
    readonly bytesWritten: number;
    readonly totalBytes: number;
    readonly isComplete: boolean;
}
