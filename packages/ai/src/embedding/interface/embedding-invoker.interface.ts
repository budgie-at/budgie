export interface EmbeddingInvokerInterface {
    readonly isReady: boolean;
    embed(text: string): Promise<number[]>;
    batchEmbed(texts: readonly string[]): Promise<Map<string, number[]>>;
}
