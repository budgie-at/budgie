'use client';

import { Trans } from '@lingui/react/macro';

import { FEATURE_REGISTRY } from '../../constant/feature-registry.constant';
import { FeatureTierEnum } from '../../constant/feature-tier.enum';
import { FeatureCard } from '../feature-card/feature-card';

interface Props {
    readonly locale: string;
}

export const FeaturesHubGrid = ({ locale }: Props) => {
    const heroFeatures = FEATURE_REGISTRY.filter(feature => feature.tier === FeatureTierEnum.HERO);
    const coreFeatures = FEATURE_REGISTRY.filter(feature => feature.tier === FeatureTierEnum.CORE);
    const powerFeatures = FEATURE_REGISTRY.filter(feature => feature.tier === FeatureTierEnum.POWER);
    const nicheFeatures = FEATURE_REGISTRY.filter(feature => feature.tier === FeatureTierEnum.NICHE);

    return (
        <div className="space-y-12">
            {heroFeatures.length > 0 && (
                <section>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-6">
                        <Trans>Headline Features</Trans>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {heroFeatures.map((feature, index) => (
                            <FeatureCard feature={feature} index={index} key={feature.slug} locale={locale} />
                        ))}
                    </div>
                </section>
            )}
            {coreFeatures.length > 0 && (
                <section>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-6">
                        <Trans>Core Features</Trans>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {coreFeatures.map((feature, index) => (
                            <FeatureCard feature={feature} index={index} key={feature.slug} locale={locale} />
                        ))}
                    </div>
                </section>
            )}
            {powerFeatures.length > 0 && (
                <section>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-6">
                        <Trans>Power-User Features</Trans>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {powerFeatures.map((feature, index) => (
                            <FeatureCard feature={feature} index={index} key={feature.slug} locale={locale} />
                        ))}
                    </div>
                </section>
            )}
            {nicheFeatures.length > 0 && (
                <section>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-6">
                        <Trans>More Features</Trans>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {nicheFeatures.map((feature, index) => (
                            <FeatureCard feature={feature} index={index} key={feature.slug} locale={locale} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};
