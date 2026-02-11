export interface SimilarCommentsQueryParamsInterface {
    readonly vecLimit: number;
    readonly distanceThreshold: number;
    readonly categoryId: number | null;
    readonly commentLimit: number;
}
