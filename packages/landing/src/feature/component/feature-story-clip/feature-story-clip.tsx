import { AppClip } from '../../../generic/component/app-clip/app-clip';

import type { ReactNode } from 'react';

interface Props {
    readonly index: number;
    readonly slug: string;
    readonly scene: string;
    readonly locale: string;
    readonly alt: string;
    readonly children?: ReactNode;
}

export const FeatureStoryClip = ({ index, slug, scene, locale, alt, children }: Props) => (
    <figure className="story-stage" data-index={index} data-story-stage>
        <span aria-hidden="true" className="story-bloom" />
        <div className="story-frame">
            <AppClip alt={alt} locale={locale} scene={scene} slug={slug} />
            {children}
        </div>
    </figure>
);
