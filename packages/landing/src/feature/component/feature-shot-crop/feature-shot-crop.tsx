import { AppShot } from '../../../generic/component/app-shot/app-shot';

import type { ReactNode } from 'react';

const DEFAULT_CROP_X = 0.5;

interface Props {
    readonly slug: string;
    readonly scene: string;
    readonly locale: string;
    readonly alt: string;
    readonly y: number;
    readonly x?: number;
    readonly children?: ReactNode;
}

export const FeatureShotCrop = ({ slug, scene, locale, alt, y, x = DEFAULT_CROP_X, children }: Props) => {
    const cropPosition = { '--crop-x': x, '--crop-y': y };

    return (
        <div className="feature-crop">
            <div className="feature-crop-shot" style={cropPosition}>
                <AppShot alt={alt} locale={locale} scene={scene} sizes="(min-width: 960px) 46rem, 160vw" slug={slug} />
                {children}
            </div>
        </div>
    );
};
