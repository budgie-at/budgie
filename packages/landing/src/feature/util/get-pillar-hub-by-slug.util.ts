import { PILLAR_HUB_REGISTRY } from '../constant/pillar-hub-registry.constant';

import type { PillarHubEntryInterface } from '../interface/pillar-hub-entry.interface';

export const getPillarHubBySlug = (slug: string): PillarHubEntryInterface | undefined =>
    PILLAR_HUB_REGISTRY.find(entry => entry.slug === slug);
