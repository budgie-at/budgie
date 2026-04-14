import { Trans } from '@lingui/react/macro';
import Link from 'next/link';

import { Motion } from '../../../generic/component/motion/motion';
import { Button } from '../../../ui/button';

interface Props {
    locale: string;
}

export const BlogArticleCta = ({ locale }: Props) => (
    <section className="w-full py-16 md:py-24 bg-muted/50">
        <div className="container px-4 md:px-6 max-w-4xl">
            <Motion>
                <div className="text-center space-y-4">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                        <Trans>Ready to Take Control of Your Financial Privacy?</Trans>
                    </h2>

                    <p className="text-lg text-muted-foreground">
                        <Trans>Join the Budgie waitlist and be the first to experience truly private expense tracking.</Trans>
                    </p>

                    <Button asChild size="lg">
                        <Link href={`/${locale}#waitlist`}>
                            <Trans>Join Waitlist</Trans>
                        </Link>
                    </Button>
                </div>
            </Motion>
        </div>
    </section>
);
