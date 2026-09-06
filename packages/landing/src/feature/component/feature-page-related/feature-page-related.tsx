import { Trans } from '@lingui/react/macro';
import Link from 'next/link';

import { isDefined } from '@rnw-community/shared';

import { Motion } from '../../../generic/component/motion/motion';
import { getI18nInstance } from '../../../i18n/app-router-i18n';
import { FEATURE_REGISTRY } from '../../constant/feature-registry.constant';
import { FeaturePageHeading } from '../feature-page-heading/feature-page-heading';
import { FeaturePageSection } from '../feature-page-section/feature-page-section';

interface Props {
    readonly locale: string;
    readonly slugs: readonly string[];
}

export const FeaturePageRelated = ({ locale, slugs }: Props) => {
    const i18n = getI18nInstance(locale);
    const features = slugs.map(slug => FEATURE_REGISTRY.find(feature => feature.slug === slug)).filter(isDefined);

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
