import { Trans, useLingui } from '@lingui/react/macro';
import { TrendingUp } from 'lucide-react';

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
                    <Badge className="rounded-full px-4 py-1.5 text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                        <TrendingUp className="size-3 mr-1" />
                        <Trans>Real Results</Trans>
                    </Badge>

                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                        <Trans>People Who Stopped Overspending</Trans>
                    </h2>

                    <p className="max-w-[800px] text-muted-foreground md:text-lg">
                        <Trans>Real stories from users who took control of their money and never looked back.</Trans>
                    </p>
                </Motion>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <TestimonialSectionItem
                        author={t`Sarah Chen`}
                        index={0}
                        quote={t`I was spending $400/month on "small purchases" without realizing it. Budgie showed me the truth in the first week. Now I save $300+ every month.`}
                        rating={5}
                        role={t`Saved $3,600/year`}
                    />

                    <TestimonialSectionItem
                        author={t`Marcus Rodriguez`}
                        index={1}
                        quote={t`Finally seeing my crypto, stocks, and bank accounts in one place changed everything. I can actually see my net worth grow instead of wondering where money went.`}
                        rating={5}
                        role={t`Tracks $50K+ across 8 accounts`}
                    />

                    <TestimonialSectionItem
                        author={t`Emily Johnson`}
                        index={2}
                        quote={t`The debt tracking feature helped me pay off my student loans 6 months early. Watching that progress bar fill up kept me motivated every single day.`}
                        rating={5}
                        role={t`Paid off $12K in debt`}
                    />

                    <TestimonialSectionItem
                        author={t`David Park`}
                        index={3}
                        quote={t`I cancelled 5 subscriptions I forgot about in the first day. That's $85/month I was literally throwing away. Budgie paid for itself instantly.`}
                        rating={5}
                        role={t`Found $1,020/year in wasted subscriptions`}
                    />

                    <TestimonialSectionItem
                        author={t`Lisa Thompson`}
                        index={4}
                        quote={t`As a freelancer with income in 3 currencies, Budgie is the only app that handles it properly. I can finally see my real financial picture.`}
                        rating={5}
                        role={t`Manages USD, EUR & GBP`}
                    />

                    <TestimonialSectionItem
                        author={t`James Wilson`}
                        index={5}
                        quote={t`The privacy aspect sold me. My financial data stays on MY phone. No company mining my spending habits. That's how it should be.`}
                        rating={5}
                        role={t`Privacy advocate`}
                    />
                </div>
            </div>
        </section>
    );
};
