import Link from 'next/link';

import { Motion } from '../../../generic/component/motion/motion';
import { PILLAR_CLASS_NAME } from '../../constant/pillar-class-name.constant';

import type { PillarEnum } from '../../constant/pillar.enum';

interface Props {
    readonly locale: string;
    readonly slug: string;
    readonly title: string;
    readonly tagline: string;
    readonly index: number;
    readonly pillar: PillarEnum;
}

export const FeatureCard = ({ locale, slug, title, tagline, index, pillar }: Props) => (
    <Motion index={index}>
        <Link
            className={`${PILLAR_CLASS_NAME[pillar]} block h-full rounded-lg border border-border/60 bg-card p-5 transition-colors hover:border-pillar`}
            href={`/${locale}/features/${slug}`}
        >
            <span aria-hidden className="mb-3 block size-2 rounded-full bg-pillar" />
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{tagline}</p>
        </Link>
    </Motion>
);
