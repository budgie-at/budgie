export interface EmbeddingQueryConfigInterface {
    readonly similarCategoriesQuery: string;
    readonly similarTagsQuery: string;
    readonly vecTableName: string;
    readonly sourceTableName: string;
}
