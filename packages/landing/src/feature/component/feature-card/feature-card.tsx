'use client';

import { useLingui } from '@lingui/react/macro';
import Link from 'next/link';

import { Motion } from '../../../generic/component/motion/motion';

import type { FeatureRegistryEntryInterface } from '../../interface/feature-registry-entry.interface';

interface Props {
    readonly locale: string;
    readonly feature: FeatureRegistryEntryInterface;
    readonly index: number;
}

export const FeatureCard = ({ locale, feature, index }: Props) => {
    const { i18n } = useLingui();

    return (
        <Motion index={index}>
            <Link
                className="block h-full rounded-lg border border-border/60 bg-card p-5 transition-colors hover:border-emerald-500/60"
                href={`/${locale}/features/${feature.slug}`}
            >
                <h3 className="font-semibold">{i18n._(feature.title)}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{i18n._(feature.tagline)}</p>
            </Link>
        </Motion>
    );
};
