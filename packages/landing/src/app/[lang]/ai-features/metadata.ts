import { msg } from '@lingui/core/macro';

import type { PillarHubMetadataInterface } from '../../../feature/interface/pillar-hub-metadata.interface';

export const AI_FEATURES_PILLAR_HUB_METADATA: PillarHubMetadataInterface = {
    slug: 'ai-features',
    title: msg`On-Device AI Finance — Private AI for Your Money`,
    metaTitle: msg`On-Device AI Finance App — Private AI — Budgie`,
    metaDescription: msg`Budgie runs Qwen3 1.7B and a 768-dim embedding model locally. AI auto-categorization, voice transaction entry, and merchant translation without sending data to the cloud.`,
    seoKeywords: [
        msg`on-device AI finance`,
        msg`private AI budget app`,
        msg`local LLM expense tracker`,
        msg`AI auto-categorization app`,
        msg`offline AI finance app`
    ],
    publishedAt: '2026-05-07',
    updatedAt: '2026-05-07'
};
