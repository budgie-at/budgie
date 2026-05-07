import { isDefined } from '@rnw-community/shared';

import { getFeatureBySlug } from '../../util/get-feature-by-slug.util';
import { FeatureCard } from '../feature-card/feature-card';

interface Props {
    readonly locale: string;
    readonly slugs: readonly string[];
}

export const PillarHubFeatureGrid = ({ locale, slugs }: Props) => {
    if (slugs.length === 0) {
        return null;
    }

    const features = slugs.map(slug => getFeatureBySlug(slug)).filter(isDefined);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => (
                <FeatureCard feature={feature} index={index} key={feature.slug} locale={locale} />
            ))}
        </div>
    );
};
