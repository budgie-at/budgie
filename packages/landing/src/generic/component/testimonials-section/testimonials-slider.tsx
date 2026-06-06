import { Trans } from '@lingui/react/macro';

import { TestimonialCard } from './testimonial-card';

export const TestimonialsSlider = () => (
    <div className="relative">
        <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
            <div className="flex gap-6 snap-x snap-mandatory">
                <TestimonialCard
                    author={<Trans>Beta tester, Kyiv</Trans>}
                    avatarLetter="B"
                    quote={
                        <Trans>
                            I was spending way more on &quot;small purchases&quot; without realizing it. Budgie showed me the truth in the
                            first week. The breakdown by category was eye-opening.
                        </Trans>
                    }
                    rating={5}
                    role={<Trans>Software engineer</Trans>}
                />

                <TestimonialCard
                    author={<Trans>Beta tester, Berlin</Trans>}
                    avatarLetter="B"
                    quote={
                        <Trans>
                            Finally seeing my crypto, stocks, and bank accounts in one place changed everything. I can actually see my net
                            worth instead of wondering where money went.
                        </Trans>
                    }
                    rating={5}
                    role={<Trans>Freelance designer</Trans>}
                />

                <TestimonialCard
                    author={<Trans>Beta tester, Vienna</Trans>}
                    avatarLetter="B"
                    quote={
                        <Trans>
                            The debt tracking feature kept me motivated. Watching the progress bar fill up every month made repayment feel
                            achievable.
                        </Trans>
                    }
                    rating={5}
                    role={<Trans>Graduate student</Trans>}
                />

                <TestimonialCard
                    author={<Trans>Beta tester, Lviv</Trans>}
                    avatarLetter="B"
                    quote={
                        <Trans>
                            I found recurring subscriptions I had completely forgotten about. Cancelled them straight away — those small
                            amounts really add up.
                        </Trans>
                    }
                    rating={5}
                    role={<Trans>Product manager</Trans>}
                />

                <TestimonialCard
                    author={<Trans>Beta tester, Amsterdam</Trans>}
                    avatarLetter="B"
                    quote={
                        <Trans>
                            As a freelancer earning in multiple currencies, Budgie handles it properly. I can finally see my real financial
                            picture without spreadsheet gymnastics.
                        </Trans>
                    }
                    rating={5}
                    role={<Trans>Independent consultant</Trans>}
                />

                <TestimonialCard
                    author={<Trans>Beta tester, San Francisco</Trans>}
                    avatarLetter="B"
                    quote={
                        <Trans>
                            The privacy aspect sold me. My financial data stays on my phone. No company is mining my spending habits.
                            That&apos;s how it should be.
                        </Trans>
                    }
                    rating={5}
                    role={<Trans>Security researcher</Trans>}
                />
            </div>
        </div>

        <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
    </div>
);
