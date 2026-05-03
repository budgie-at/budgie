'use client';

import { Trans, useLingui } from '@lingui/react/macro';
import Link from 'next/link';

import { Motion } from '../../../generic/component/motion/motion';
import { FEATURE_REGISTRY } from '../../constant/feature-registry.constant';
import { FeatureTierEnum } from '../../constant/feature-tier.enum';

interface Props {
    readonly locale: string;
}

const TIER_ORDER = [FeatureTierEnum.HERO, FeatureTierEnum.CORE, FeatureTierEnum.POWER, FeatureTierEnum.NICHE] as const;

export const FeaturesHubGrid = ({ locale }: Props) => {
    const { i18n } = useLingui();

    return (
        <div className="space-y-12">
            {TIER_ORDER.map(tier => {
                const items = FEATURE_REGISTRY.filter(feature => feature.tier === tier);

                if (items.length === 0) {
                    return null;
                }

                return (
                    <section key={tier}>
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-6">
                            {tier === FeatureTierEnum.HERO ? <Trans>Headline Features</Trans> : null}
                            {tier === FeatureTierEnum.CORE ? <Trans>Core Features</Trans> : null}
                            {tier === FeatureTierEnum.POWER ? <Trans>Power-User Features</Trans> : null}
                            {tier === FeatureTierEnum.NICHE ? <Trans>More Features</Trans> : null}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {items.map((feature, index) => (
                                <Motion index={index} key={feature.slug}>
                                    <Link
                                        className="block h-full rounded-lg border border-border/60 bg-card p-5 transition-colors hover:border-emerald-500/60"
                                        href={`/${locale}/features/${feature.slug}`}
                                    >
                                        <h3 className="font-semibold">{i18n._(feature.title)}</h3>
                                        <p className="mt-2 text-sm text-muted-foreground">{i18n._(feature.tagline)}</p>
                                    </Link>
                                </Motion>
                            ))}
                        </div>
                    </section>
                );
            })}
        </div>
    );
};
