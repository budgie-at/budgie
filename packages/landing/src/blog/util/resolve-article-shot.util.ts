import { isNotEmptyArray } from '@rnw-community/shared';

import { MediaKindEnum } from '../../generic/enum/media-kind.enum';
import { hashText } from '../../generic/util/hash-text.util';
import { resolveMediaAsset } from '../../generic/util/resolve-media-asset.util';
import { isCompleteBlogCoverShot } from '../type-guard/is-complete-blog-cover-shot.type-guard';

import type { BlogCoverShotInterface } from '../interface/blog-cover-shot.interface';

const SCENE_SUFFIXES = ['-1', '-2'];

export const resolveArticleShot = (slug: string, featureSlugs: readonly string[], locale: string): BlogCoverShotInterface | undefined => {
    const candidates = featureSlugs
        .flatMap(featureSlug =>
            SCENE_SUFFIXES.map(suffix => resolveMediaAsset(featureSlug, `${featureSlug}${suffix}`, locale, MediaKindEnum.STILL))
        )
        .filter(isCompleteBlogCoverShot);

    return isNotEmptyArray(candidates) ? candidates[hashText(slug) % candidates.length] : candidates[0];
};
