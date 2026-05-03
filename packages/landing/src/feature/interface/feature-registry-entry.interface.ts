import type { MessageDescriptor } from '@lingui/core';

import type { FeatureTierEnum } from '../constant/feature-tier.enum';
import type { FeatureFaqInterface } from './feature-faq.interface';

export interface FeatureRegistryEntryInterface {
    readonly slug: string;
    readonly tier: FeatureTierEnum;
    readonly title: MessageDescriptor;
    readonly tagline: MessageDescriptor;
    readonly metaTitle: MessageDescriptor;
    readonly metaDescription: MessageDescriptor;
    readonly primaryKeyword: string;
    readonly seoKeywords: readonly string[];
    readonly heroBenefits: readonly MessageDescriptor[];
    readonly relatedFeatureSlugs: readonly string[];
    readonly relatedArticleSlugs: readonly string[];
    readonly faqs: readonly FeatureFaqInterface[];
    readonly publishedAt: string;
    readonly updatedAt: string;
    readonly ogTags: readonly string[];
}
