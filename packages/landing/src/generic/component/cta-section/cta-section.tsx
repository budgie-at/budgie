import { Trans } from '@lingui/react/macro';
import { Check, Lock, WifiOff } from 'lucide-react';

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
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight max-w-3xl">
                    <Trans>Take Control of Your Finances — Without Giving Up Your Privacy</Trans>
                </h2>

                <p className="mx-auto max-w-[700px] text-white/90 md:text-xl">
                    <Trans>
                        Currently in private beta — join the waitlist for early access to the only budget app that keeps your financial data
                        entirely on your device.
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
                        <WifiOff className="size-4" />

                        <span>
                            <Trans>Offline-first architecture</Trans>
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Lock className="size-4" />

                        <span>
                            <Trans>AES-256 encrypted on-device storage</Trans>
                        </span>
                    </div>
                </div>
            </Motion>
        </div>
    </section>
);
