import { AppShot } from '../../../generic/component/app-shot/app-shot';

import type { ReactNode } from 'react';

const DEFAULT_FOCUS = 0.5;

interface Props {
    readonly index: number;
    readonly slug: string;
    readonly scene: string;
    readonly locale: string;
    readonly alt: string;
    readonly priority?: boolean;
    readonly focus?: number;
    readonly children?: ReactNode;
}

export const FeatureStoryShot = ({ index, slug, scene, locale, alt, priority = false, focus = DEFAULT_FOCUS, children }: Props) => {
    const focusStyle = { '--story-focus': focus };

    return (
        <figure className="story-shot" data-index={index} data-story-stage style={focusStyle}>
            <div className="story-frame">
                <AppShot
                    alt={alt}
                    locale={locale}
                    priority={priority}
                    scene={scene}
                    sizes="(min-width: 1280px) 26.5rem, (min-width: 1024px) 22rem, 50vw"
                    slug={slug}
                />
                {children}
            </div>
        </figure>
    );
};
