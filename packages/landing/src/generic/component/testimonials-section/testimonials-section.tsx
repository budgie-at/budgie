import { Trans, useLingui } from '@lingui/react/macro';

import { Badge } from '../../../ui/badge';
import { Motion } from '../motion/motion';
import { TestimonialSectionItem } from '../testimonials-section-item/testimonial-section-item';

const initialMotion = { opacity: 0, y: 20 };
const animatedMotion = { opacity: 1, y: 0 };
const transitionMotion = { duration: 0.5 };
const viewportOnce = { once: true };

export const TestimonialsSection = () => {
    const { t } = useLingui();

    return (
        <section className="w-full py-20 md:py-32" id="testimonials">
            <div className="container px-4 md:px-6">
                <Motion
                    className="flex flex-col items-center justify-center space-y-4 text-center mb-12"
                    initial={initialMotion}
                    transition={transitionMotion}
                    viewport={viewportOnce}
                    whileInView={animatedMotion}
                >
                    <Badge className="rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
                        <Trans>Testimonials</Trans>
                    </Badge>

                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                        <Trans>Trusted by Privacy-Conscious Users</Trans>
                    </h2>

                    <p className="max-w-[800px] text-muted-foreground md:text-lg">
                        <Trans>See what users love about Budgie&apos;s approach to private, comprehensive expense tracking.</Trans>
                    </p>
                </Motion>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <TestimonialSectionItem
                        author={t`Sarah Chen`}
                        index={0}
                        quote={t`Finally, an expense tracker that doesn't spy on me! Budgie works perfectly offline and my bank sync is seamless. Love the multi-currency support.`}
                        rating={5}
                        role={t`Digital Nomad`}
                    />

                    <TestimonialSectionItem
                        author={t`Marcus Rodriguez`}
                        index={1}
                        quote={t`The crypto tracking is incredible. I can see all my DeFi positions alongside my traditional accounts. The privacy-first approach sold me immediately.`}
                        rating={5}
                        role={t`Crypto Investor`}
                    />

                    <TestimonialSectionItem
                        author={t`Emily Johnson`}
                        index={2}
                        quote={t`As a freelancer with multiple currencies, Budgie is a lifesaver. The debt tracking helped me pay off my student loans 6 months early!`}
                        rating={5}
                        role={t`Freelance Designer`}
                    />
                </div>
            </div>
        </section>
    );
};
