import { isDefined } from '@rnw-community/shared';

import { MEDIA_MANIFEST } from '../constant/media-manifest.constant';
import { MediaThemeEnum } from '../enum/media-theme.enum';

import type { MediaAssetType } from '../interface/media-asset.type';
import type { MediaRequestInterface } from '../interface/media-request.interface';

const FALLBACK_LOCALES = ['en', 'neutral'];

export const resolveMediaAsset = (request: MediaRequestInterface, theme: MediaThemeEnum): MediaAssetType | undefined => {
    const candidates = MEDIA_MANIFEST.filter(
        asset => asset.group === request.group && asset.scene === request.scene && asset.kind === request.kind && asset.theme === theme
    );

    return [request.locale, ...FALLBACK_LOCALES].map(locale => candidates.find(asset => asset.locale === locale)).find(isDefined);
};
