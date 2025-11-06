import { Trans } from '@lingui/react/macro';
import { ArrowRight, Github, Smartphone } from 'lucide-react';

import { Button } from '../../../ui/button';
import { Motion } from '../motion/motion';

const initialMotion = { opacity: 0, y: 20 };
const transitionMotion = { duration: 0.5 };
const viewportMotion = { once: true };
const whileInViewMotion = { opacity: 1, y: 0 };

export const CtaSection = () => (
    <section className="w-full py-20 md:py-32 bg-linear-to-br from-primary to-primary/80 text-primary-foreground relative overflow-hidden">
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
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                    <Trans>Take Control of Your Financial Privacy</Trans>
                </h2>

                <p className="mx-auto max-w-[700px] text-primary-foreground/80 md:text-xl">
                    <Trans>
                        Join thousands of privacy-conscious users who trust Budgie to track their expenses without compromising their
                        financial data.
                    </Trans>
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <Button className="rounded-full h-12 px-8 text-base" size="lg" variant="secondary">
                        <Smartphone className="mr-2 size-4" />
                        <Trans>Join Whitelist</Trans>
                        <ArrowRight className="ml-2 size-4" />
                    </Button>

                    <Button
                        className="rounded-full h-12 px-8 text-base bg-transparent border-white text-white hover:bg-white/10"
                        size="lg"
                        variant="outline"
                    >
                        <Github className="mr-2 size-4" />
                        <Trans>View Source Code</Trans>
                    </Button>
                </div>

                <p className="text-sm text-primary-foreground/80 mt-4">
                    <Trans>100% secure • Open source • Your data stays on your device</Trans>
                </p>
            </Motion>
        </div>
    </section>
);
