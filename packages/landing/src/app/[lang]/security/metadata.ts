import { msg } from '@lingui/core/macro';

import { PillarEnum } from '../../../feature/constant/pillar.enum';

import type { PillarHubMetadataInterface } from '../../../feature/interface/pillar-hub-metadata.interface';

export const SECURITY_PILLAR_HUB_METADATA: PillarHubMetadataInterface = {
    slug: 'security',
    pillar: PillarEnum.PRIVACY,
    title: msg`Encrypted Budget App — Lock Down Your Financial Data`,
    metaTitle: msg`Encrypted Budget App — Biometric Lock — Budgie`,
    metaDescription: msg`Budgie protects your finances with on-device encryption once you set a PIN, biometric and PIN lock, screenshot blur, and backup files you keep yourself. No server ever sees your data.`,
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
