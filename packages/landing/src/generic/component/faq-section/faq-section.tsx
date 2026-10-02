import { Trans } from '@lingui/react/macro';

import { FaqSectionAccordion } from '../faq-section-accordion/faq-section-accordion';

export const FaqSection = () => (
    <section className="w-full py-8 md:py-20" id="faq">
        <div className="container px-4 md:px-6 max-w-7xl">
            <div className="max-w-2xl mb-8 md:mb-12">
                <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-balance">
                    <Trans>Offline expense tracker FAQ</Trans>
                </h2>

                <p className="mt-3 text-base md:text-lg text-muted-foreground text-pretty">
                    <Trans>Where the data lives, what works offline, how bank sync avoids your login, and what it costs.</Trans>
                </p>
            </div>

            <div className="max-w-3xl">
                <FaqSectionAccordion />
            </div>
        </div>
    </section>
);
