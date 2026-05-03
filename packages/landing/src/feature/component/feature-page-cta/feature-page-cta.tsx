import { Trans } from '@lingui/react/macro';
import Link from 'next/link';

import { Motion } from '../../../generic/component/motion/motion';
import { Button } from '../../../ui/button';

interface Props {
    readonly locale: string;
}

export const FeaturePageCta = ({ locale }: Props) => (
    <section className="w-full py-16 md:py-24 bg-muted/50">
        <div className="container px-4 md:px-6 max-w-4xl">
            <Motion className="text-center space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                    <Trans>Ready to take Budgie for a spin?</Trans>
                </h2>
                <p className="text-lg text-muted-foreground">
                    <Trans>Join the waitlist — be first to try the offline-first expense tracker.</Trans>
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button asChild size="lg">
                        <Link href={`/${locale}#waitlist`}>
                            <Trans>Join Waitlist</Trans>
                        </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline">
                        <Link href={`/${locale}/features`}>
                            <Trans>Browse All Features</Trans>
                        </Link>
                    </Button>
                </div>
            </Motion>
        </div>
    </section>
);
