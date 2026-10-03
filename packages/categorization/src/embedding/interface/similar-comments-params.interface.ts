export interface SimilarCommentsParamsInterface {
    readonly vecLimit: number;
    readonly distanceThreshold: number;
    readonly categoryId: number;
    readonly commentLimit: number;
}
