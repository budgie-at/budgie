import type { FeatureCategoryEnum } from '../constant/feature-category.enum';
import type { FeatureTierEnum } from '../constant/feature-tier.enum';
import type { PillarEnum } from '../constant/pillar.enum';
import type { MessageDescriptor } from '@lingui/core';

export interface FeatureRegistryEntryInterface {
    readonly slug: string;
    readonly tier: FeatureTierEnum;
    readonly pillar: PillarEnum;
    readonly category?: FeatureCategoryEnum;
    readonly name: MessageDescriptor;
    readonly tagline: MessageDescriptor;
    readonly metaTitle: MessageDescriptor;
    readonly metaDescription: MessageDescriptor;
    readonly primaryKeyword: string;
    readonly seoKeywords: readonly string[];
    readonly relatedFeatureSlugs: readonly string[];
    readonly relatedArticleSlugs: readonly string[];
    readonly publishedAt: string;
    readonly updatedAt: string;
    readonly ogTags: readonly string[];
}
