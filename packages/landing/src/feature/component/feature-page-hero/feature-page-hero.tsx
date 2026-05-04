import { Trans } from '@lingui/react/macro';
import Link from 'next/link';

import { Motion } from '../../../generic/component/motion/motion';
import { Button } from '../../../ui/button';

import type { ReactNode } from 'react';

interface Props {
    readonly locale: string;
    readonly heading: ReactNode;
    readonly tagline: ReactNode;
    readonly breadcrumbs: ReactNode;
}

export const FeaturePageHero = ({ locale, heading, tagline, breadcrumbs }: Props) => (
    <section className="w-full pt-12 pb-16 md:pt-20 md:pb-24 bg-gradient-to-b from-emerald-50/40 to-background dark:from-emerald-950/20">
        <div className="container px-4 md:px-6 max-w-4xl">
            <Motion>
                {breadcrumbs}
                <h1 className="mt-6 text-3xl md:text-5xl font-bold tracking-tight">{heading}</h1>
                <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl">{tagline}</p>
                <div className="mt-8 flex flex-wrap gap-3">
                    <Button asChild size="lg">
                        <Link href={`/${locale}#waitlist`}>
                            <Trans>Join Waitlist</Trans>
                        </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline">
                        <Link href={`/${locale}/features`}>
                            <Trans>All Features</Trans>
                        </Link>
                    </Button>
                </div>
            </Motion>
        </div>
    </section>
);
