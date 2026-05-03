import type { MessageDescriptor } from '@lingui/core';

export interface ArticleRegistryEntryInterface {
    readonly slug: string;
    readonly date: string;
    readonly author: string;
    readonly image: string;
    readonly readingTimeMinutes: number;
    readonly title: MessageDescriptor;
    readonly description: MessageDescriptor;
    readonly tags: readonly string[];
    readonly seoKeywords: readonly string[];
    readonly seoDescription: MessageDescriptor;
    readonly relatedFeatureSlugs: readonly string[];
}
