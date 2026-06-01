import { msg } from '@lingui/core/macro';

import type { PillarHubMetadataInterface } from '../../../feature/interface/pillar-hub-metadata.interface';

export const PRIVACY_PILLAR_HUB_METADATA: PillarHubMetadataInterface = {
    slug: 'privacy',
    title: msg`Private Expense Tracker — On Your Device, Off the Cloud`,
    metaTitle: msg`Private Expense Tracker — On-Device — Budgie`,
    metaDescription: msg`Budgie is a private expense tracker by architecture: encrypted on-device storage, no account, no aggregator, biometric lock, screenshot protection, and your own cloud backups.`,
    seoKeywords: [
        msg`private expense tracker`,
        msg`no account budget app`,
        msg`no telemetry finance app`,
        msg`on-device expense tracker`,
        msg`no cloud budget app`
    ],
    publishedAt: '2026-05-07',
    updatedAt: '2026-05-07'
};
