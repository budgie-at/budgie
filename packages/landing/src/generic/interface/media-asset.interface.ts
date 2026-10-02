import type { MediaKindEnum } from '../enum/media-kind.enum';
import type { MediaThemeEnum } from '../enum/media-theme.enum';

export interface MediaAssetInterface {
    readonly slug: string;
    readonly locale: string;
    readonly scene: string;
    readonly theme: MediaThemeEnum;
    readonly kind: MediaKindEnum;
}
