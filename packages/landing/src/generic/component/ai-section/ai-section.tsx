import { Trans } from '@lingui/react/macro';
import { CloudOff, Mic, ShieldAlert, Smartphone } from 'lucide-react';

import { Badge } from '../../../ui/badge';
import { AiSectionDetails } from '../ai-section-details/ai-section-details';
import { AiSectionFeatures } from '../ai-section-features/ai-section-features';
import { Motion } from '../motion/motion';

const headerInitialMotion = { opacity: 0, y: 20 };
const headerTransitionMotion = { duration: 0.5 };
const headerViewportMotion = { once: true };
const headerWhileInViewMotion = { opacity: 1, y: 0 };

const leftColumnInitialMotion = { opacity: 0, x: -20 };
const leftColumnTransitionMotion = { duration: 0.5 };
const leftColumnViewportMotion = { once: true };
const leftColumnWhileInViewMotion = { opacity: 1, x: 0 };

const rightColumnInitialMotion = { opacity: 0, x: 20 };
const rightColumnTransitionMotion = { duration: 0.5, delay: 0.2 };
const rightColumnViewportMotion = { once: true };
const rightColumnWhileInViewMotion = { opacity: 1, x: 0 };

export const AiSection = () => (
    <section className="w-full py-20 md:py-32 bg-muted/30">
        <div className="container px-4 md:px-6">
            <Motion
                className="flex flex-col items-center justify-center space-y-4 text-center mb-16"
                initial={headerInitialMotion}
                transition={headerTransitionMotion}
                viewport={headerViewportMotion}
                whileInView={headerWhileInViewMotion}
            >
                <div className="flex flex-wrap items-center justify-center gap-2">
                    <Badge className="rounded-full px-4 py-1.5 text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                        <Smartphone className="size-3 mr-1" />
                        <Trans>On-Device AI</Trans>
                    </Badge>

                    <Badge className="rounded-full px-4 py-1.5 text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800">
                        <Mic className="size-3 mr-1" />
                        <Trans>Voice Input</Trans>
                    </Badge>

                    <Badge className="rounded-full px-4 py-1.5 text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800">
                        <CloudOff className="size-3 mr-1" />
                        <Trans>Zero Cloud</Trans>
                    </Badge>
                </div>

                <h2 className="text-3xl md:text-4xl font-bold tracking-tight max-w-3xl">
                    <Trans>AI That Never Leaks Your Secrets</Trans>
                </h2>

                <p className="max-w-[800px] text-muted-foreground md:text-lg">
                    <Trans>
                        Other apps send your financial questions to ChatGPT or Google—exposing your salary, debts, and spending habits.
                        Budgie&apos;s AI runs 100% on your device. Your conversations never touch the internet.
                    </Trans>
                </p>

                <div className="flex items-center gap-2 mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <ShieldAlert className="size-4 text-red-600 dark:text-red-400 shrink-0" />

                    <span className="text-sm text-red-700 dark:text-red-400">
                        <Trans>Cloud AI apps expose: your income, rent, debts, and every purchase you make</Trans>
                    </span>
                </div>
            </Motion>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
                <Motion
                    className="space-y-8"
                    initial={leftColumnInitialMotion}
                    transition={leftColumnTransitionMotion}
                    viewport={leftColumnViewportMotion}
                    whileInView={leftColumnWhileInViewMotion}
                >
                    <AiSectionFeatures />
                </Motion>

                <Motion
                    className="relative"
                    initial={rightColumnInitialMotion}
                    transition={rightColumnTransitionMotion}
                    viewport={rightColumnViewportMotion}
                    whileInView={rightColumnWhileInViewMotion}
                >
                    <AiSectionDetails />
                </Motion>
            </div>
        </div>
    </section>
);
