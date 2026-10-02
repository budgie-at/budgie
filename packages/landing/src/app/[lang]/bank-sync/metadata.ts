import { msg } from '@lingui/core/macro';

import type { PillarHubMetadataInterface } from '../../../feature/interface/pillar-hub-metadata.interface';

export const BANK_SYNC_PILLAR_HUB_METADATA: PillarHubMetadataInterface = {
    slug: 'bank-sync',
    title: msg`Bank Sync & Statement Import — Bring Your Bank Data In`,
    metaTitle: msg`Bank Sync & Statement Import — Budgie`,
    metaDescription: msg`Connect your bank for automatic sync, or import statements from PDF, XLSX, or CSV. Budgie catches duplicate imports, matches transfers automatically, and lets you fix a bad sync without starting over.`,
    seoKeywords: [
        msg`bank sync budget app`,
        msg`bank statement import app`,
        msg`automatic bank sync`,
        msg`CSV bank import`,
        msg`duplicate transaction cleanup`
    ],
    publishedAt: '2026-09-26',
    updatedAt: '2026-09-26'
};
