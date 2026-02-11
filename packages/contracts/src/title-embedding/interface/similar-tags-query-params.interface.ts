export interface SimilarTagsQueryParamsInterface {
    readonly vecLimit: number;
    readonly distanceThreshold: number;
    readonly categoryId: number | null;
    readonly tagLimit: number;
}
