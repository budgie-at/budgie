import { isDefined } from '@rnw-community/shared';

import { MEDIA_MANIFEST } from '../constant/media-manifest.constant';
import { MediaThemeEnum } from '../enum/media-theme.enum';

import type { MediaKindEnum } from '../enum/media-kind.enum';
import type { MediaAssetInterface } from '../interface/media-asset.interface';

const FALLBACK_LOCALE = 'en';

export const resolveMediaAsset = (
    slug: string,
    scene: string,
    locale: string,
    kind: MediaKindEnum
): Record<MediaThemeEnum, MediaAssetInterface | undefined> => {
    const candidates = MEDIA_MANIFEST.filter(asset => asset.slug === slug && asset.scene === scene && asset.kind === kind);
    const resolveTheme = (theme: MediaThemeEnum) =>
        [locale, FALLBACK_LOCALE]
            .map(candidateLocale => candidates.find(asset => asset.theme === theme && asset.locale === candidateLocale))
            .find(isDefined);

    return { [MediaThemeEnum.LIGHT]: resolveTheme(MediaThemeEnum.LIGHT), [MediaThemeEnum.DARK]: resolveTheme(MediaThemeEnum.DARK) };
};
