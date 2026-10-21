import { Trans } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { MEDIA_MANIFEST } from '../../../generic/constant/media-manifest.constant';
import { FEATURE_REGISTRY } from '../../constant/feature-registry.constant';
import { FeatureRelatedCard } from '../feature-related-card/feature-related-card';

interface Props {
    readonly locale: string;
    readonly slugs: readonly string[];
}

export const FeatureRelated = ({ locale, slugs }: Props) => {
    const cards = slugs
        .map(slug => FEATURE_REGISTRY.find(feature => feature.slug === slug))
        .filter(isDefined)
        .flatMap(feature =>
            MEDIA_MANIFEST.filter(entry => entry.slug === feature.slug)
                .slice(0, 1)
                .map(entry => ({ feature, scene: entry.scene }))
        )
        .slice(0, 3);

    return (
        <section aria-labelledby="related-heading" className="feature-section">
            <div className="container">
                <div className="feature-section-head">
                    <h2 className="feature-section-title" id="related-heading">
                        <Trans>Works well with</Trans>
                    </h2>
                </div>
                <div className="feature-related">
                    {cards.map(({ feature, scene }) => (
                        <FeatureRelatedCard feature={feature} key={feature.slug} locale={locale} scene={scene} />
                    ))}
                </div>
            </div>
        </section>
    );
};
