import { isDefined } from '@rnw-community/shared';

import { FEATURE_REGISTRY } from '../constant/feature-registry.constant';

import type { FeatureRegistryEntryInterface } from '../interface/feature-registry-entry.interface';

export const getRelatedFeatures = (entry: FeatureRegistryEntryInterface): readonly FeatureRegistryEntryInterface[] =>
    entry.relatedFeatureSlugs.map(relatedSlug => FEATURE_REGISTRY.find(item => item.slug === relatedSlug)).filter(isDefined);
