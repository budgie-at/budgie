export interface BlogBrowserArticleInterface {
    readonly slug: string;
    readonly title: string;
    readonly description: string;
    readonly date: string;
    readonly author: string;
    readonly tags: readonly string[];
    readonly image: string;
    readonly readingTimeMinutes: number;
}
