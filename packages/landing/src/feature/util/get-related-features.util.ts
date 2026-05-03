import { isDefined } from '@rnw-community/shared';

import { FEATURE_REGISTRY } from '../constant/feature-registry.constant';

import type { FeatureRegistryEntryInterface } from '../interface/feature-registry-entry.interface';

export const getRelatedFeatures = (slug: string): readonly FeatureRegistryEntryInterface[] => {
    const entry = FEATURE_REGISTRY.find(item => item.slug === slug);
    if (!isDefined(entry)) {
        return [];
    }

    return entry.relatedFeatureSlugs
        .map(relatedSlug => FEATURE_REGISTRY.find(item => item.slug === relatedSlug))
        .filter(isDefined);
};
