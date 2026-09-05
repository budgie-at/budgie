import { cn } from 'cn';

import { MEDIA_ASSET_HEIGHT, MEDIA_ASSET_WIDTH } from '../../constant/media-size.constant';
import { resolveMediaAssetPath } from '../../util/resolve-media-asset-path.util';

import type { MediaAssetInterface } from '../../interface/media-asset.interface';

interface Props {
    asset: MediaAssetInterface;
    alt: string;
    className: string;
    priority: boolean;
    sizes?: string;
}

export const AppShotPicture = ({ asset, alt, className, priority, sizes }: Props) => {
    const basePath = resolveMediaAssetPath(asset);
    const loading = priority ? 'eager' : 'lazy';
    const fetchPriority = priority ? 'high' : 'auto';

    return (
        <picture>
            <source srcSet={`${basePath}@2x.avif`} type="image/avif" />
            <source srcSet={`${basePath}@2x.webp`} type="image/webp" />
            <img
                alt={alt}
                className={cn('h-auto w-full', className)}
                decoding="async"
                fetchPriority={fetchPriority}
                height={MEDIA_ASSET_HEIGHT}
                loading={loading}
                sizes={sizes}
                src={`${basePath}@2x.webp`}
                width={MEDIA_ASSET_WIDTH}
            />
        </picture>
    );
};
