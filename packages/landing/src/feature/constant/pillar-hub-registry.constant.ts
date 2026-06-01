import { AI_FEATURES_PILLAR_HUB_METADATA } from '../../app/[lang]/ai-features/metadata';
import { OFFLINE_FIRST_PILLAR_HUB_METADATA } from '../../app/[lang]/offline-first/metadata';
import { OPEN_SOURCE_PILLAR_HUB_METADATA } from '../../app/[lang]/open-source/metadata';
import { PRIVACY_PILLAR_HUB_METADATA } from '../../app/[lang]/privacy/metadata';
import { SECURITY_PILLAR_HUB_METADATA } from '../../app/[lang]/security/metadata';

import type { PillarHubEntryInterface } from '../interface/pillar-hub-entry.interface';

export const PILLAR_HUB_REGISTRY: readonly PillarHubEntryInterface[] = [
    PRIVACY_PILLAR_HUB_METADATA,
    OFFLINE_FIRST_PILLAR_HUB_METADATA,
    AI_FEATURES_PILLAR_HUB_METADATA,
    SECURITY_PILLAR_HUB_METADATA,
    OPEN_SOURCE_PILLAR_HUB_METADATA
];
