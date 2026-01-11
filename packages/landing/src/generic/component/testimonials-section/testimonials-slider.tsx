import { useLingui } from '@lingui/react/macro';

import { TestimonialCard } from './testimonial-card';

export const TestimonialsSlider = () => {
    const { t } = useLingui();

    return (
        <div className="relative">
            <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                <div className="flex gap-6 snap-x snap-mandatory">
                    <TestimonialCard
                        author={t`Sarah Chen`}
                        quote={t`I was spending $400/month on "small purchases" without realizing it. Budgie showed me the truth in the first week. Now I save $300+ every month.`}
                        rating={5}
                        role={t`Saved $3,600/year`}
                    />

                    <TestimonialCard
                        author={t`Marcus Rodriguez`}
                        quote={t`Finally seeing my crypto, stocks, and bank accounts in one place changed everything. I can actually see my net worth grow instead of wondering where money went.`}
                        rating={5}
                        role={t`Tracks $50K+ across 8 accounts`}
                    />

                    <TestimonialCard
                        author={t`Emily Johnson`}
                        quote={t`The debt tracking feature helped me pay off my student loans 6 months early. Watching that progress bar fill up kept me motivated every single day.`}
                        rating={5}
                        role={t`Paid off $12K in debt`}
                    />

                    <TestimonialCard
                        author={t`David Park`}
                        quote={t`I cancelled 5 subscriptions I forgot about in the first day. That's $85/month I was literally throwing away. Budgie paid for itself instantly.`}
                        rating={5}
                        role={t`Found $1,020/year in wasted subscriptions`}
                    />

                    <TestimonialCard
                        author={t`Lisa Thompson`}
                        quote={t`As a freelancer with income in 3 currencies, Budgie is the only app that handles it properly. I can finally see my real financial picture.`}
                        rating={5}
                        role={t`Manages USD, EUR & GBP`}
                    />

                    <TestimonialCard
                        author={t`James Wilson`}
                        quote={t`The privacy aspect sold me. My financial data stays on MY phone. No company mining my spending habits. That's how it should be.`}
                        rating={5}
                        role={t`Privacy advocate`}
                    />
                </div>
            </div>

            <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        </div>
    );
};
