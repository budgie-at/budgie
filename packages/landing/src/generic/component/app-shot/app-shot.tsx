import { isDefined } from '@rnw-community/shared';

import { MediaKindEnum } from '../../enum/media-kind.enum';
import { resolveMediaAsset } from '../../util/resolve-media-asset.util';

import { AppShotPicture } from './app-shot-picture';

import type { ReactNode } from 'react';

interface Props {
    slug: string;
    scene: string;
    locale: string;
    alt: string;
    fallback?: ReactNode;
    priority?: boolean;
    sizes?: string;
}

export const AppShot = ({ slug, scene, locale, alt, fallback, priority = false, sizes }: Props) => {
    const { light: lightAsset, dark: darkAsset } = resolveMediaAsset(slug, scene, locale, MediaKindEnum.STILL);

    if (!isDefined(lightAsset) || !isDefined(darkAsset)) {
        return fallback;
    }

    return (
        <>
            <AppShotPicture alt={alt} asset={lightAsset} className="block dark:hidden" priority={priority} sizes={sizes} />
            <AppShotPicture alt={alt} asset={darkAsset} className="hidden dark:block" priority={priority} sizes={sizes} />
        </>
    );
};
