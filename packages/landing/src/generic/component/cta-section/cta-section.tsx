import { Trans } from '@lingui/react/macro';

import { WaitlistForm } from '../waitlist-form/waitlist-form';

export const CtaSection = () => (
    <section className="w-full bg-primary py-16 text-primary-foreground md:py-24" id="waitlist">
        <div className="container px-4 md:px-6 max-w-7xl">
            <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
                <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-balance">
                    <Trans>Take control of your money without handing it over</Trans>
                </h2>

                <p className="text-base md:text-lg text-primary-foreground/90 text-pretty">
                    <Trans>Budgie is in private beta. Join the waitlist and we will write to you when your build is ready.</Trans>
                </p>

                <div className="w-full">
                    <WaitlistForm initialCount={2847} showCount={false} variant="cta" />
                </div>
            </div>
        </div>
    </section>
);
