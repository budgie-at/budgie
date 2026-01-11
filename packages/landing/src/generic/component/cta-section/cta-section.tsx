import { Trans } from '@lingui/react/macro';
import { ArrowRight, Check, Download, Github, TrendingDown } from 'lucide-react';

import { Button } from '../../../ui/button';
import { Motion } from '../motion/motion';

const initialMotion = { opacity: 0, y: 20 };
const transitionMotion = { duration: 0.5 };
const viewportMotion = { once: true };
const whileInViewMotion = { opacity: 1, y: 0 };

export const CtaSection = () => (
    <section className="w-full py-20 md:py-32 bg-linear-to-br from-red-600 to-orange-500 text-white relative overflow-hidden">
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
                        <Trans>Average user saves $200/month</Trans>
                    </span>
                </div>

                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight max-w-3xl">
                    <Trans>Stop Wondering Where Your Money Goes</Trans>
                </h2>

                <p className="mx-auto max-w-[700px] text-white/90 md:text-xl">
                    <Trans>
                        Every day you wait is another day of overspending. Start tracking today and see exactly where your money
                        disappears—no account required, no data shared.
                    </Trans>
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <Button className="rounded-full h-14 px-10 text-lg font-semibold bg-white text-red-600 hover:bg-white/90" size="lg">
                        <Download className="mr-2 size-5" />
                        <Trans>Start Saving Now</Trans>
                        <ArrowRight className="ml-2 size-5" />
                    </Button>

                    <Button
                        className="rounded-full h-14 px-10 text-lg bg-transparent border-white text-white hover:bg-white/10"
                        size="lg"
                        variant="outline"
                    >
                        <Github className="mr-2 size-5" />
                        <Trans>View Source</Trans>
                    </Button>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-6 mt-6 text-sm text-white/80">
                    <div className="flex items-center gap-2">
                        <Check className="size-4" />

                        <span>
                            <Trans>Free 14-day trial</Trans>
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Check className="size-4" />

                        <span>
                            <Trans>No credit card needed</Trans>
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Check className="size-4" />

                        <span>
                            <Trans>100% private</Trans>
                        </span>
                    </div>
                </div>
            </Motion>
        </div>
    </section>
);
