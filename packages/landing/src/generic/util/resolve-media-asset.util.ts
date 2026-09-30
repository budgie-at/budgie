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
    const entries = MEDIA_MANIFEST.filter(entry => entry.slug === slug && entry.scene === scene && entry.kind === kind);
    const resolveTheme = (theme: MediaThemeEnum) => {
        const resolvedLocale = [locale, FALLBACK_LOCALE].find(candidateLocale =>
            entries.some(entry => entry.themes.includes(theme) && entry.locales.includes(candidateLocale))
        );

        return [resolvedLocale].filter(isDefined).map(assetLocale => ({ slug, locale: assetLocale, scene, theme, kind }))[0];
    };

    return { [MediaThemeEnum.LIGHT]: resolveTheme(MediaThemeEnum.LIGHT), [MediaThemeEnum.DARK]: resolveTheme(MediaThemeEnum.DARK) };
};
