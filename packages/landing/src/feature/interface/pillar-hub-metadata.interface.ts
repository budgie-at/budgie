import type { MessageDescriptor } from '@lingui/core';

export interface PillarHubMetadataInterface {
    readonly slug: string;
    readonly title: MessageDescriptor;
    readonly metaTitle: MessageDescriptor;
    readonly metaDescription: MessageDescriptor;
    readonly seoKeywords: readonly MessageDescriptor[];
    readonly publishedAt: string;
    readonly updatedAt: string;
}
