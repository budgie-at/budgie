import { isDefined } from '@rnw-community/shared';

import { WaitlistForm } from '../../../generic/component/waitlist-form/waitlist-form';
import { WaitlistVariantEnum } from '../../../generic/enum/waitlist-variant.enum';
import { FeaturePageHeroShot } from '../feature-page-hero-shot/feature-page-hero-shot';
import { FeatureTrustStrip } from '../feature-trust-strip/feature-trust-strip';

import type { ReactNode } from 'react';

interface Props {
    readonly heading: ReactNode;
    readonly tagline: ReactNode;
    readonly breadcrumbs: ReactNode;
    readonly children?: ReactNode;
}

const FeaturePageHeroRoot = ({ heading, tagline, breadcrumbs, children }: Props) => (
    <section className="feature-hero w-full">
        <div className="feature-hero-grid container" data-stage={isDefined(children)}>
            <div className="feature-hero-copy">
                {breadcrumbs}
                <h1 className="feature-hero-title hero-enter hero-title">{heading}</h1>
                <p className="feature-hero-lede hero-enter hero-lede">{tagline}</p>
                <div className="mt-5 hero-enter hero-lede md:mt-6">
                    <WaitlistForm showCount={false} variant={WaitlistVariantEnum.FEATURE} />
                </div>
                <FeatureTrustStrip />
            </div>
            {children}
        </div>
    </section>
);

export const FeaturePageHero = Object.assign(FeaturePageHeroRoot, {
    Shot: FeaturePageHeroShot
});
