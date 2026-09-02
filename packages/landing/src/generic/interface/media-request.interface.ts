import { MediaKindEnum } from '../enum/media-kind.enum';

export interface MediaRequestInterface {
    readonly group: string;
    readonly scene: string;
    readonly locale: string;
    readonly kind: MediaKindEnum;
}
