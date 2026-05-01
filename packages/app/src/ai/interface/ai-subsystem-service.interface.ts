export interface AiSubsystemServiceInterface<TSnapshot> {
    start(): Promise<void>;
    stop(): Promise<void>;
    retry(): Promise<void>;
    subscribe(listener: () => void): () => void;
    getSnapshot(): TSnapshot;
}
