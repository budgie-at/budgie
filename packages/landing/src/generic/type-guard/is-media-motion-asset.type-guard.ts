import { isDefined } from '@rnw-community/shared';

import { MediaKindEnum } from '../enum/media-kind.enum';

import type { MediaAssetType } from '../interface/media-asset.type';
import type { MediaMotionAssetInterface } from '../interface/media-motion-asset.interface';

export const isMediaMotionAsset = (asset: MediaAssetType | undefined): asset is MediaMotionAssetInterface =>
    isDefined(asset) && asset.kind === MediaKindEnum.MOTION;
