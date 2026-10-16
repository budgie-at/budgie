import type { MediaThemeEnum } from '../enum/media-theme.enum';

export interface MediaManifestEntryInterface {
    readonly slug: string;
    readonly scene: string;
    readonly locales: readonly string[];
    readonly themes: readonly MediaThemeEnum[];
}
