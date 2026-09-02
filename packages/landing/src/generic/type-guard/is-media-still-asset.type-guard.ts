import { isDefined } from '@rnw-community/shared';

import { MediaKindEnum } from '../enum/media-kind.enum';

import type { MediaAssetType } from '../interface/media-asset.type';
import type { MediaStillAssetInterface } from '../interface/media-still-asset.interface';

export const isMediaStillAsset = (asset: MediaAssetType | undefined): asset is MediaStillAssetInterface =>
    isDefined(asset) && asset.kind === MediaKindEnum.STILL;
