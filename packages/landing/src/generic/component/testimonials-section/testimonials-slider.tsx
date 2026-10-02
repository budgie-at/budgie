import { Trans } from '@lingui/react/macro';

import { TestimonialCard } from './testimonial-card';

export const TestimonialsSlider = () => (
    <div className="grid gap-4 md:grid-cols-3 md:gap-6">
        <TestimonialCard
            author={<Trans>Beta tester, Kyiv</Trans>}
            quote={
                <Trans>
                    I was spending way more on &quot;small purchases&quot; without realizing it. Budgie showed me the truth in the first
                    week. The breakdown by category was eye-opening.
                </Trans>
            }
            role={<Trans>Software engineer</Trans>}
        />

        <TestimonialCard
            author={<Trans>Beta tester, Lviv</Trans>}
            quote={
                <Trans>
                    I found recurring subscriptions I had completely forgotten about. Cancelled them straight away, and those small amounts
                    really add up.
                </Trans>
            }
            role={<Trans>Product manager</Trans>}
        />

        <TestimonialCard
            author={<Trans>Beta tester, San Francisco</Trans>}
            quote={
                <Trans>
                    The privacy aspect sold me. My financial data stays on my phone. No company is mining my spending habits. That&apos;s
                    how it should be.
                </Trans>
            }
            role={<Trans>Security researcher</Trans>}
        />
    </div>
);
