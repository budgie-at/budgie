import { buildPageMetadata } from '../../generic/util/build-page-metadata.util';

import type { PillarHubMetadataInterface } from '../interface/pillar-hub-metadata.interface';
import type { I18n } from '@lingui/core';
import type { Metadata } from 'next';

export const buildPillarHubRouteMetadata = (i18n: I18n, metadata: PillarHubMetadataInterface): Metadata =>
    buildPageMetadata({
        locale: i18n.locale,
        path: `/${metadata.slug}`,
        title: i18n._(metadata.metaTitle),
        description: i18n._(metadata.metaDescription),
        keywords: metadata.seoKeywords.map(keyword => i18n._(keyword)).join(', '),
        publishedAt: metadata.publishedAt,
        updatedAt: metadata.updatedAt
    });
