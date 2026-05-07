import { useLingui } from '@lingui/react/macro';

import { TestimonialCard } from './testimonial-card';

export const TestimonialsSlider = () => {
    const { t } = useLingui();

    return (
        <div className="relative">
            <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                <div className="flex gap-6 snap-x snap-mandatory">
                    <TestimonialCard
                        author={t`Beta tester, Kyiv`}
                        quote={t`I was spending way more on "small purchases" without realizing it. Budgie showed me the truth in the first week. The breakdown by category was eye-opening.`}
                        rating={5}
                        role={t`Software engineer`}
                    />

                    <TestimonialCard
                        author={t`Beta tester, Berlin`}
                        quote={t`Finally seeing my crypto, stocks, and bank accounts in one place changed everything. I can actually see my net worth instead of wondering where money went.`}
                        rating={5}
                        role={t`Freelance designer`}
                    />

                    <TestimonialCard
                        author={t`Beta tester, Vienna`}
                        quote={t`The debt tracking feature kept me motivated. Watching the progress bar fill up every month made repayment feel achievable.`}
                        rating={5}
                        role={t`Graduate student`}
                    />

                    <TestimonialCard
                        author={t`Beta tester, Lviv`}
                        quote={t`I found recurring subscriptions I had completely forgotten about. Cancelled them straight away — those small amounts really add up.`}
                        rating={5}
                        role={t`Product manager`}
                    />

                    <TestimonialCard
                        author={t`Beta tester, Amsterdam`}
                        quote={t`As a freelancer earning in multiple currencies, Budgie handles it properly. I can finally see my real financial picture without spreadsheet gymnastics.`}
                        rating={5}
                        role={t`Independent consultant`}
                    />

                    <TestimonialCard
                        author={t`Beta tester, San Francisco`}
                        quote={t`The privacy aspect sold me. My financial data stays on my phone. No company is mining my spending habits. That's how it should be.`}
                        rating={5}
                        role={t`Security researcher`}
                    />
                </div>
            </div>

            <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        </div>
    );
};
