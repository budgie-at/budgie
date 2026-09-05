import { AppShot } from '../../../generic/component/app-shot/app-shot';

import type { ReactNode } from 'react';

interface Props {
    readonly index: number;
    readonly slug: string;
    readonly scene: string;
    readonly locale: string;
    readonly alt: string;
    readonly priority?: boolean;
    readonly children?: ReactNode;
}

export const FeatureStoryShot = ({ index, slug, scene, locale, alt, priority = false, children }: Props) => (
    <figure className="story-stage" data-index={index} data-story-stage>
        <span aria-hidden="true" className="story-bloom" />
        <div className="story-frame">
            <AppShot alt={alt} locale={locale} priority={priority} scene={scene} sizes="(min-width: 1024px) 18rem, 88vw" slug={slug} />
            {children}
        </div>
    </figure>
);
