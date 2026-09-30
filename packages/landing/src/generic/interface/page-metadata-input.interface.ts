export interface PageMetadataInputInterface {
    readonly locale: string;
    readonly path: string;
    readonly title: string;
    readonly description: string;
    readonly keywords: string;
    readonly publishedAt: string;
    readonly updatedAt?: string;
    readonly author?: string;
}
