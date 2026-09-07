import { cn } from 'cn';

import { MEDIA_ASSET_HEIGHT, MEDIA_ASSET_WIDTH } from '../../constant/media-size.constant';
import { resolveMediaAssetPath } from '../../util/resolve-media-asset-path.util';

import type { MediaAssetInterface } from '../../interface/media-asset.interface';

interface Props {
    asset: MediaAssetInterface;
    alt: string;
    className: string;
}

export const AppClipMedia = ({ asset, alt, className }: Props) => {
    const basePath = resolveMediaAssetPath(asset);
    // oxlint-disable-next-line lingui/no-unlocalized-strings
    const playableMedia = `(prefers-color-scheme: ${asset.theme}) and (prefers-reduced-motion: no-preference)`;

    return (
        <div className={cn('relative', className)}>
            <img
                alt={alt}
                className="h-auto w-full"
                decoding="async"
                height={MEDIA_ASSET_HEIGHT}
                loading="lazy"
                src={`${basePath}-poster.webp`}
                width={MEDIA_ASSET_WIDTH}
            />

            <video
                aria-hidden="true"
                autoPlay
                className="absolute inset-0 size-full motion-reduce:hidden"
                height={MEDIA_ASSET_HEIGHT}
                loop
                muted
                playsInline
                preload="none"
                width={MEDIA_ASSET_WIDTH}
            >
                <source media={playableMedia} src={`${basePath}.webm`} type="video/webm" />
                <source media={playableMedia} src={`${basePath}.mp4`} type="video/mp4" />
            </video>
        </div>
    );
};
