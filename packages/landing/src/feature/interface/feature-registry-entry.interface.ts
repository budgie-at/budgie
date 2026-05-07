import type { FeatureComparisonRowInterface } from './feature-comparison-row.interface';
import type { FeatureFaqInterface } from './feature-faq.interface';
import type { FeatureCategoryEnum } from '../constant/feature-category.enum';
import type { FeatureTierEnum } from '../constant/feature-tier.enum';
import type { MessageDescriptor } from '@lingui/core';

export interface FeatureRegistryEntryInterface {
    readonly slug: string;
    readonly tier: FeatureTierEnum;
    readonly category?: FeatureCategoryEnum;
    readonly title: MessageDescriptor;
    readonly tagline: MessageDescriptor;
    readonly metaTitle: MessageDescriptor;
    readonly metaDescription: MessageDescriptor;
    readonly primaryKeyword: string;
    readonly seoKeywords: readonly string[];
    readonly relatedFeatureSlugs: readonly string[];
    readonly relatedArticleSlugs: readonly string[];
    readonly faqs: readonly FeatureFaqInterface[];
    readonly comparisonRows?: readonly FeatureComparisonRowInterface[];
    readonly comparisonCategoryLabel?: MessageDescriptor;
    readonly publishedAt: string;
    readonly updatedAt: string;
    readonly ogTags: readonly string[];
}
