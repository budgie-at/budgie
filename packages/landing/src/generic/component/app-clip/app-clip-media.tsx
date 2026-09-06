import { cn } from 'cn';

import { MEDIA_ASSET_HEIGHT, MEDIA_ASSET_WIDTH } from '../../constant/media-size.constant';
import { resolveMediaAssetPath } from '../../util/resolve-media-asset-path.util';

import type { MediaAssetInterface } from '../../interface/media-asset.interface';

interface Props {
    asset: MediaAssetInterface;
    alt: string;
    className: string;
    priority: boolean;
}

export const AppClipMedia = ({ asset, alt, className, priority }: Props) => {
    const basePath = resolveMediaAssetPath(asset);
    // oxlint-disable-next-line lingui/no-unlocalized-strings
    const colorScheme = `(prefers-color-scheme: ${asset.theme})`;
    // oxlint-disable-next-line lingui/no-unlocalized-strings
    const playableMedia = `${colorScheme} and (prefers-reduced-motion: no-preference)`;
    const posterSrc = `${basePath}-poster.webp`;
    const fetchPriority = priority ? 'high' : 'auto';

    return (
        <div className={cn('relative', className)}>
            {priority ? <link as="image" fetchPriority="high" href={posterSrc} media={colorScheme} rel="preload" /> : null}

            <img
                alt={alt}
                className="h-auto w-full"
                decoding="async"
                fetchPriority={fetchPriority}
                height={MEDIA_ASSET_HEIGHT}
                loading="lazy"
                src={posterSrc}
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
