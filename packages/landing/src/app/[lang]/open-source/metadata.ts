import { msg } from '@lingui/core/macro';

import type { PillarHubMetadataInterface } from '../../../feature/interface/pillar-hub-metadata.interface';

export const OPEN_SOURCE_PILLAR_HUB_METADATA: PillarHubMetadataInterface = {
    slug: 'open-source',
    title: msg`Source-Available Personal Finance — Transparent by Design`,
    metaTitle: msg`Source-Available Personal Finance App — Budgie`,
    metaDescription: msg`Budgie is a source-available personal finance app. Read the source, audit privacy claims, contribute features, and trust your expense tracker because you can verify it.`,
    seoKeywords: [
        msg`source available personal finance`,
        msg`public source budget app`,
        msg`auditable expense tracker`,
        msg`transparent finance app`,
        msg`auditable budget app`
    ],
    publishedAt: '2026-05-07',
    updatedAt: '2026-05-07'
};
