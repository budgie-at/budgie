'use client';

import { useTheme } from 'next-themes';
import { useEffect, useRef } from 'react';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { MEDIA_ASSET_HEIGHT, MEDIA_ASSET_WIDTH } from '../../constant/media-size.constant';

import type { MediaThemeEnum } from '../../enum/media-theme.enum';

interface Props {
    theme: MediaThemeEnum;
    srcWebm: string;
    srcMp4: string;
}

export const AppClipVideo = ({ theme, srcWebm, srcMp4 }: Props) => {
    const { resolvedTheme } = useTheme();
    const videoRef = useRef<HTMLVideoElement>(null);
    const isActiveTheme = resolvedTheme === theme;

    useEffect(() => {
        const video = videoRef.current;
        // oxlint-disable-next-line lingui/no-unlocalized-strings
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!isDefined(video) || !isActiveTheme || prefersReducedMotion) {
            return;
        }

        video.load();
        video.play().catch(emptyFn);
    }, [isActiveTheme]);

    return (
        <video
            ref={videoRef}
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
            {isActiveTheme ? <source src={srcWebm} type="video/webm" /> : null}
            {isActiveTheme ? <source src={srcMp4} type="video/mp4" /> : null}
        </video>
    );
};
