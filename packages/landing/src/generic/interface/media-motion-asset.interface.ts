import { MediaKindEnum } from '../enum/media-kind.enum';
import { MediaThemeEnum } from '../enum/media-theme.enum';

export interface MediaMotionAssetInterface {
    readonly group: string;
    readonly locale: string;
    readonly theme: MediaThemeEnum;
    readonly scene: string;
    readonly kind: MediaKindEnum.MOTION;
    readonly width: number;
    readonly height: number;
    readonly webmPath: string;
    readonly mp4Path: string;
    readonly posterPath: string;
}
