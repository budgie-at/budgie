import { mediaFrameVariants } from '../../constant/media-frame-variants.constant';

import type { MediaFrameEnum } from '../../enum/media-frame.enum';
import type { MediaMotionAssetInterface } from '../../interface/media-motion-asset.interface';

interface Props {
    asset: MediaMotionAssetInterface;
    alt: string;
    frame: MediaFrameEnum;
}

export const AppClipMedia = ({ asset, alt, frame }: Props) => (
    <>
        <video
            aria-label={alt}
            autoPlay
            className={mediaFrameVariants({ className: 'block motion-reduce:hidden', frame })}
            height={asset.height}
            loop
            muted
            playsInline
            poster={asset.posterPath}
            preload="metadata"
            width={asset.width}
        >
            <source src={asset.webmPath} type="video/webm" />
            <source src={asset.mp4Path} type="video/mp4" />
        </video>

        <img
            alt={alt}
            className={mediaFrameVariants({ className: 'hidden motion-reduce:block', frame })}
            decoding="async"
            height={asset.height}
            loading="lazy"
            src={asset.posterPath}
            width={asset.width}
        />
    </>
);
