import { Trans } from '@lingui/react/macro';
import { Check, Clock, TrendingDown } from 'lucide-react';

import { Motion } from '../motion/motion';
import { WaitlistForm } from '../waitlist-form/waitlist-form';

const initialMotion = { opacity: 0, y: 20 };
const transitionMotion = { duration: 0.5 };
const viewportMotion = { once: true };
const whileInViewMotion = { opacity: 1, y: 0 };

export const CtaSection = () => (
    <section className="w-full py-20 md:py-32 bg-linear-to-br from-red-600 to-orange-500 text-white relative overflow-hidden" id="waitlist">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-size-[4rem_4rem]" />

        <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

        <div className="container px-4 md:px-6 relative">
            <Motion
                className="flex flex-col items-center justify-center space-y-6 text-center"
                initial={initialMotion}
                transition={transitionMotion}
                viewport={viewportMotion}
                whileInView={whileInViewMotion}
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm">
                    <TrendingDown className="size-4" />

                    <span className="text-sm font-medium">
                        <Trans>Average user saves $347/month</Trans>
                    </span>
                </div>

                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight max-w-3xl">
                    <Trans>Every Day You Wait Is Another $15 Gone</Trans>
                </h2>

                <p className="mx-auto max-w-[700px] text-white/90 md:text-xl">
                    <Trans>
                        Join 2,800+ smart savers who refuse to let another dollar slip away. Get early access to the only budget app that
                        actually respects your privacy.
                    </Trans>
                </p>

                <div className="mt-6 w-full max-w-xl">
                    <WaitlistForm initialCount={2847} showCount={false} variant="cta" />
                </div>

                <div className="flex flex-wrap items-center justify-center gap-6 mt-6 text-sm text-white/80">
                    <div className="flex items-center gap-2">
                        <Check className="size-4" />

                        <span>
                            <Trans>Privacy-first design</Trans>
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Check className="size-4" />

                        <span>
                            <Trans>Offline-first architecture</Trans>
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Clock className="size-4" />

                        <span>
                            <Trans>Launching Q1 2026</Trans>
                        </span>
                    </div>
                </div>
            </Motion>
        </div>
    </section>
);
