import { Trans } from '@lingui/react/macro';

import { Badge } from '../../../ui/badge';
import { FaqSectionAccordion } from '../faq-section-accordion/faq-section-accordion';
import { Motion } from '../motion/motion';

const initialMotion = { opacity: 0, y: 20 };
const animatedMotion = { opacity: 1, y: 0 };
const transitionMotion = { duration: 0.5 };
const viewportOnce = { once: true };

export const FaqSection = () => (
    <section className="w-full py-20 md:py-32" id="faq">
        <div className="container px-4 md:px-6">
            <Motion
                className="flex flex-col items-center justify-center space-y-4 text-center mb-12"
                initial={initialMotion}
                transition={transitionMotion}
                viewport={viewportOnce}
                whileInView={animatedMotion}
            >
                <Badge className="rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
                    <Trans>FAQ</Trans>
                </Badge>

                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                    <Trans>Frequently Asked Questions</Trans>
                </h2>

                <p className="max-w-[800px] text-muted-foreground md:text-lg">
                    <Trans>Everything you need to know about Budgie&apos;s privacy-first approach to expense tracking.</Trans>
                </p>
            </Motion>

            <div className="mx-auto max-w-3xl">
                <FaqSectionAccordion />
            </div>
        </div>
    </section>
);
