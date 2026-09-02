import { MediaKindEnum } from '../enum/media-kind.enum';
import { MediaThemeEnum } from '../enum/media-theme.enum';

export interface MediaStillAssetInterface {
    readonly group: string;
    readonly locale: string;
    readonly theme: MediaThemeEnum;
    readonly scene: string;
    readonly kind: MediaKindEnum.STILL;
    readonly width: number;
    readonly height: number;
    readonly avifPath: string;
    readonly webpPath: string;
}
