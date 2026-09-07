import { isDefined } from '@rnw-community/shared';

import type { MediaThemeEnum } from '../../generic/enum/media-theme.enum';
import type { MediaAssetInterface } from '../../generic/interface/media-asset.interface';
import type { BlogCoverShotInterface } from '../interface/blog-cover-shot.interface';

export const isCompleteBlogCoverShot = (
    candidate: Record<MediaThemeEnum, MediaAssetInterface | undefined>
): candidate is BlogCoverShotInterface => isDefined(candidate.light) && isDefined(candidate.dark);
