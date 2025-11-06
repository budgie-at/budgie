import { Trans, useLingui } from '@lingui/react/macro';
import { ArrowRight, Check, Github, Smartphone } from 'lucide-react';
import Image from 'next/image';

import { Badge } from '../../../ui/badge';
import { Button } from '../../../ui/button';
import { Motion } from '../motion/motion';

const initialMotionHeader = { opacity: 0, y: 20 };
const animatedMotionHeader = { opacity: 1, y: 0 };
const transitionMotionHeader = { duration: 0.5 };
const initialMotionImage = { opacity: 0, y: 40 };
const animatedMotionImage = { opacity: 1, y: 0 };
const transitionMotionImage = { duration: 0.7, delay: 0.2 };

export const HeroSection = () => {
    const { t } = useLingui();

    return (
        <section className="w-full py-20 md:py-32 lg:py-40 overflow-hidden">
            <div className="container py-6 px-4 md:px-6 relative">
                <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

                <Motion
                    animate={animatedMotionHeader}
                    className="text-center max-w-3xl mx-auto mb-12"
                    initial={initialMotionHeader}
                    transition={transitionMotionHeader}
                >
                    <Badge className="mb-4 rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
                        <Github className="size-3 mr-1" />
                        <Trans>Open Source & Private</Trans>
                    </Badge>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/70">
                        <Trans>Your Money, Your Privacy, Your Control</Trans>
                    </h1>

                    <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                        <Trans>
                            Budgie is the offline-first expense tracker that keeps your financial data completely private. Track cash,
                            crypto, stocks, and bank accounts across multiple currencies—all stored securely on your device.
                        </Trans>
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button className="rounded-full h-12 px-8 text-base" size="lg">
                            <Smartphone className="mr-2 size-4" />
                            <Trans>Join Whitelist</Trans>
                            <ArrowRight className="ml-2 size-4" />
                        </Button>

                        <Button className="rounded-full h-12 px-8 text-base bg-transparent" size="lg" variant="outline">
                            <Github className="mr-2 size-4" />
                            <Trans>View Source Code</Trans>
                        </Button>
                    </div>

                    <div className="flex items-center justify-center gap-4 mt-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Check className="size-4 text-primary" />

                            <span>
                                <Trans>100% Secure</Trans>
                            </span>
                        </div>

                        <div className="flex items-center gap-1">
                            <Check className="size-4 text-primary" />

                            <span>
                                <Trans>Open Source</Trans>
                            </span>
                        </div>

                        <div className="flex items-center gap-1">
                            <Check className="size-4 text-primary" />

                            <span>
                                <Trans>Privacy First</Trans>
                            </span>
                        </div>
                    </div>
                </Motion>

                <Motion
                    animate={animatedMotionImage}
                    className="relative mx-auto max-w-lg"
                    initial={initialMotionImage}
                    transition={transitionMotionImage}
                >
                    <div className="rounded-xl overflow-hidden shadow-2xl border border-border/40 bg-linear-to-b from-background to-muted/20">
                        <Image
                            alt={t`Budgie mobile app interface showing balance overview with multi-currency bank accounts including Monobank cards and various account types`}
                            className="w-full h-auto"
                            height={720}
                            priority
                            src="/images/design-mode/ai-budgeting-app-4x.jpg"
                            width={1280}
                        />

                        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-black/10 dark:ring-white/10" />
                    </div>

                    <div className="absolute -bottom-6 -right-6 -z-10 h-[300px] w-[300px] rounded-full bg-linear-to-br from-primary/30 to-secondary/30 blur-3xl opacity-70" />

                    <div className="absolute -top-6 -left-6 -z-10 h-[300px] w-[300px] rounded-full bg-linear-to-br from-secondary/30 to-primary/30 blur-3xl opacity-70" />
                </Motion>
            </div>
        </section>
    );
};
