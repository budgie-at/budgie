import { isDefined } from '@rnw-community/shared';

import { MediaKindEnum } from '../../enum/media-kind.enum';
import { resolveMediaAsset } from '../../util/resolve-media-asset.util';

import { AppClipMedia } from './app-clip-media';

import type { ReactNode } from 'react';

interface Props {
    slug: string;
    scene: string;
    locale: string;
    alt: string;
    fallback?: ReactNode;
}

export const AppClip = ({ slug, scene, locale, alt, fallback }: Props) => {
    const { light: lightAsset, dark: darkAsset } = resolveMediaAsset(slug, scene, locale, MediaKindEnum.MOTION);

    if (!isDefined(lightAsset) || !isDefined(darkAsset)) {
        return fallback;
    }

    return (
        <>
            <div className="block dark:hidden">
                <AppClipMedia alt={alt} asset={lightAsset} />
            </div>

            <div className="hidden dark:block">
                <AppClipMedia alt={alt} asset={darkAsset} />
            </div>
        </>
    );
};
