import Link from 'next/link';

import { Motion } from '../../../generic/component/motion/motion';

interface Props {
    readonly locale: string;
    readonly slug: string;
    readonly title: string;
    readonly tagline: string;
    readonly index: number;
}

export const FeatureCard = ({ locale, slug, title, tagline, index }: Props) => (
    <Motion index={index}>
        <Link
            className="block h-full rounded-lg border border-border/60 bg-card p-5 transition-colors hover:border-emerald-500/60"
            href={`/${locale}/features/${slug}`}
        >
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{tagline}</p>
        </Link>
    </Motion>
);
