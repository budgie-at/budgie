import { isDefined } from '@rnw-community/shared';

import { resolveMediaAsset } from '../../utils/resolve-media-asset.util';

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
    const { light: lightAsset, dark: darkAsset } = resolveMediaAsset(slug, scene, locale);

    if (!isDefined(lightAsset) || !isDefined(darkAsset)) {
        return fallback;
    }

    return (
        <>
            <AppShotPicture alt={alt} asset={lightAsset} className="block dark:hidden" priority={priority} sizes={sizes} />
            <AppShotPicture
                alt={alt}
                asset={darkAsset}
                className="hidden dark:block"
                deferred={!priority}
                priority={priority}
                sizes={sizes}
            />
        </>
    );
};
