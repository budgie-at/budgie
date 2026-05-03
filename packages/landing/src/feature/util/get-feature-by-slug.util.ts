import { FEATURE_REGISTRY } from '../constant/feature-registry.constant';

import type { FeatureRegistryEntryInterface } from '../interface/feature-registry-entry.interface';

export const getFeatureBySlug = (slug: string): FeatureRegistryEntryInterface | undefined =>
    FEATURE_REGISTRY.find(entry => entry.slug === slug);
