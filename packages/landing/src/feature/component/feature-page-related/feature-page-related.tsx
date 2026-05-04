'use client';

import { Trans, useLingui } from '@lingui/react/macro';
import Link from 'next/link';

import { Motion } from '../../../generic/component/motion/motion';
import { FeaturePageHeading } from '../feature-page-heading/feature-page-heading';
import { FeaturePageSection } from '../feature-page-section/feature-page-section';

import type { FeatureRegistryEntryInterface } from '../../interface/feature-registry-entry.interface';

interface Props {
    readonly locale: string;
    readonly features: readonly FeatureRegistryEntryInterface[];
}

export const FeaturePageRelated = ({ locale, features }: Props) => {
    const { i18n } = useLingui();

    return (
        <FeaturePageSection>
            <FeaturePageHeading>
                <Trans>Related Features</Trans>
            </FeaturePageHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                    <Motion index={index} key={feature.slug}>
                        <Link
                            className="block rounded-lg border border-border/60 bg-card p-4 transition-colors hover:border-emerald-500/60 hover:bg-card/80"
                            href={`/${locale}/features/${feature.slug}`}
                        >
                            <h3 className="font-semibold">{i18n._(feature.title)}</h3>
                            <p className="mt-1 text-sm text-muted-foreground">{i18n._(feature.tagline)}</p>
                        </Link>
                    </Motion>
                ))}
            </div>
        </FeaturePageSection>
    );
};
