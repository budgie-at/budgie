import { MEDIA_ASSET_HEIGHT, MEDIA_ASSET_WIDTH } from '../../constant/media-size.constant';
import { resolveMediaAssetPath } from '../../util/resolve-media-asset-path.util';

import type { MediaAssetInterface } from '../../interface/media-asset.interface';

interface Props {
    asset: MediaAssetInterface;
    alt: string;
}

export const AppClipMedia = ({ asset, alt }: Props) => {
    const basePath = resolveMediaAssetPath(asset);

    return (
        <>
            <video
                aria-label={alt}
                autoPlay
                className="block h-auto w-full motion-reduce:hidden"
                height={MEDIA_ASSET_HEIGHT}
                loop
                muted
                playsInline
                poster={`${basePath}-poster.webp`}
                preload="metadata"
                width={MEDIA_ASSET_WIDTH}
            >
                <source src={`${basePath}.webm`} type="video/webm" />
                <source src={`${basePath}.mp4`} type="video/mp4" />
            </video>

            <img
                alt={alt}
                className="hidden h-auto w-full motion-reduce:block"
                decoding="async"
                height={MEDIA_ASSET_HEIGHT}
                loading="lazy"
                src={`${basePath}-poster.webp`}
                width={MEDIA_ASSET_WIDTH}
            />
        </>
    );
};
