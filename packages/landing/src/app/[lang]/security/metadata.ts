import { msg } from '@lingui/core/macro';

import type { PillarHubMetadataInterface } from '../../../feature/interface/pillar-hub-metadata.interface';

export const SECURITY_PILLAR_HUB_METADATA: PillarHubMetadataInterface = {
    slug: 'security',
    title: msg`Encrypted Budget App — Lock Down Your Financial Data`,
    metaTitle: msg`Encrypted Budget App — Biometric Lock — Budgie`,
    metaDescription: msg`Budgie protects your finances with AES-256 encrypted SQLite, biometric and PIN lock, screenshot blur, and encrypted cloud backups. No server ever sees your data.`,
    seoKeywords: [
        msg`encrypted budget app`,
        msg`secure expense tracker`,
        msg`biometric finance app`,
        msg`PIN lock budget app`,
        msg`encrypted finance app`
    ],
    publishedAt: '2026-05-07',
    updatedAt: '2026-05-07'
};
