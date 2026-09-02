import { MediaFrameEnum } from '../../enum/media-frame.enum';
import { MediaKindEnum } from '../../enum/media-kind.enum';
import { MediaThemeEnum } from '../../enum/media-theme.enum';
import { isMediaMotionAsset } from '../../type-guard/is-media-motion-asset.type-guard';
import { resolveMediaAsset } from '../../util/resolve-media-asset.util';

import { AppClipMedia } from './app-clip-media';

import type { ReactNode } from 'react';

interface Props {
    group: string;
    scene: string;
    locale: string;
    alt: string;
    fallback?: ReactNode;
    frame?: MediaFrameEnum;
}

export const AppClip = ({ group, scene, locale, alt, fallback, frame = MediaFrameEnum.DEVICE }: Props) => {
    const request = { group, scene, locale, kind: MediaKindEnum.MOTION };
    const lightAsset = resolveMediaAsset(request, MediaThemeEnum.LIGHT);
    const darkAsset = resolveMediaAsset(request, MediaThemeEnum.DARK);

    if (!isMediaMotionAsset(lightAsset) || !isMediaMotionAsset(darkAsset)) {
        return fallback;
    }

    return (
        <>
            <div className="block dark:hidden">
                <AppClipMedia alt={alt} asset={lightAsset} frame={frame} />
            </div>

            <div className="hidden dark:block">
                <AppClipMedia alt={alt} asset={darkAsset} frame={frame} />
            </div>
        </>
    );
};
