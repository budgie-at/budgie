export interface AiModelFileInterface {
    readonly url: string;
    readonly directory: string | null;
    readonly filename: string;
    readonly estimatedBytes: number;
}
