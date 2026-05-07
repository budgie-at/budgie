import type { FeatureFaqInterface } from './feature-faq.interface';
import type { MessageDescriptor } from '@lingui/core';

export interface PillarHubEntryInterface {
    readonly slug: string;
    readonly title: MessageDescriptor;
    readonly tagline: MessageDescriptor;
    readonly metaTitle: MessageDescriptor;
    readonly metaDescription: MessageDescriptor;
    readonly primaryKeyword: string;
    readonly seoKeywords: readonly string[];
    readonly memberFeatureSlugs: readonly string[];
    readonly faqs: readonly FeatureFaqInterface[];
    readonly heroBullets: readonly MessageDescriptor[];
    readonly publishedAt: string;
    readonly updatedAt: string;
}
