import { MediaFrameEnum } from '../../enum/media-frame.enum';
import { MediaKindEnum } from '../../enum/media-kind.enum';
import { MediaThemeEnum } from '../../enum/media-theme.enum';
import { isMediaStillAsset } from '../../type-guard/is-media-still-asset.type-guard';
import { resolveMediaAsset } from '../../util/resolve-media-asset.util';

import { AppShotPicture } from './app-shot-picture';

import type { ReactNode } from 'react';

interface Props {
    group: string;
    scene: string;
    locale: string;
    alt: string;
    fallback?: ReactNode;
    frame?: MediaFrameEnum;
    priority?: boolean;
    sizes?: string;
}

export const AppShot = ({ group, scene, locale, alt, fallback, frame = MediaFrameEnum.DEVICE, priority = false, sizes }: Props) => {
    const request = { group, scene, locale, kind: MediaKindEnum.STILL };
    const lightAsset = resolveMediaAsset(request, MediaThemeEnum.LIGHT);
    const darkAsset = resolveMediaAsset(request, MediaThemeEnum.DARK);

    if (!isMediaStillAsset(lightAsset) || !isMediaStillAsset(darkAsset)) {
        return fallback;
    }

    return (
        <>
            <AppShotPicture alt={alt} asset={lightAsset} className="block dark:hidden" frame={frame} priority={priority} sizes={sizes} />
            <AppShotPicture alt={alt} asset={darkAsset} className="hidden dark:block" frame={frame} priority={priority} sizes={sizes} />
        </>
    );
};
