import { mediaFrameVariants } from '../../constant/media-frame-variants.constant';

import type { MediaFrameEnum } from '../../enum/media-frame.enum';
import type { MediaStillAssetInterface } from '../../interface/media-still-asset.interface';

interface Props {
    asset: MediaStillAssetInterface;
    alt: string;
    className: string;
    frame: MediaFrameEnum;
    priority: boolean;
    sizes?: string;
}

export const AppShotPicture = ({ asset, alt, className, frame, priority, sizes }: Props) => {
    const loading = priority ? 'eager' : 'lazy';
    const fetchPriority = priority ? 'high' : 'auto';

    return (
        <picture>
            <source srcSet={asset.avifPath} type="image/avif" />
            <source srcSet={asset.webpPath} type="image/webp" />
            <img
                alt={alt}
                className={mediaFrameVariants({ className, frame })}
                decoding="async"
                fetchPriority={fetchPriority}
                height={asset.height}
                loading={loading}
                sizes={sizes}
                src={asset.webpPath}
                width={asset.width}
            />
        </picture>
    );
};
