import { isEmptyArray } from '@rnw-community/shared';

import { getI18nInstance } from '../../../i18n/app-router-i18n';
import { FeatureCard } from '../feature-card/feature-card';

import type { FeatureRegistryEntryInterface } from '../../interface/feature-registry-entry.interface';
import type { ReactNode } from 'react';

interface Props {
    readonly locale: string;
    readonly features: readonly FeatureRegistryEntryInterface[];
    readonly children: ReactNode;
}

export const FeaturesHubTierSection = ({ locale, features, children }: Props) => {
    if (isEmptyArray(features)) {
        return null;
    }

    const i18n = getI18nInstance(locale);

    return (
        <section>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-6">{children}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {features.map((feature, index) => (
                    <FeatureCard
                        index={index}
                        key={feature.slug}
                        locale={locale}
                        slug={feature.slug}
                        tagline={i18n._(feature.tagline)}
                        title={i18n._(feature.title)}
                    />
                ))}
            </div>
        </section>
    );
};
