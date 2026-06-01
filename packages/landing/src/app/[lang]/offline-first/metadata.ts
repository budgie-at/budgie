import { msg } from '@lingui/core/macro';

import type { PillarHubMetadataInterface } from '../../../feature/interface/pillar-hub-metadata.interface';

export const OFFLINE_FIRST_PILLAR_HUB_METADATA: PillarHubMetadataInterface = {
    slug: 'offline-first',
    title: msg`Offline Budget App — Track Expenses Without Internet`,
    metaTitle: msg`Offline Budget App — Works Without Internet — Budgie`,
    metaDescription: msg`Budgie is a fully offline budget app. Add expenses, view analytics, and import bank statements without any internet connection. Your data stays on your device.`,
    seoKeywords: [
        msg`offline budget app`,
        msg`offline expense tracker`,
        msg`no internet budget app`,
        msg`budget app without wifi`,
        msg`local expense tracker`
    ],
    publishedAt: '2026-05-07',
    updatedAt: '2026-05-07'
};
