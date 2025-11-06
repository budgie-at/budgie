import { Trans } from '@lingui/react/macro';
import { Sparkles } from 'lucide-react';

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
    <section className="w-full py-20 md:py-32">
        <div className="container px-4 md:px-6">
            <Motion
                className="flex flex-col items-center justify-center space-y-4 text-center mb-16"
                initial={headerInitialMotion}
                transition={headerTransitionMotion}
                viewport={headerViewportMotion}
                whileInView={headerWhileInViewMotion}
            >
                <Badge className="rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
                    <Sparkles className="size-3 mr-1" />
                    <Trans>AI Assistant</Trans>
                </Badge>

                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                    <Trans>Smart Financial Insights, Privately Powered</Trans>
                </h2>

                <p className="max-w-[800px] text-muted-foreground md:text-lg">
                    <Trans>
                        Get instant answers about your spending with Budgie&apos;s on-device AI. No data leaves your phone—smart analysis
                        happens locally for complete privacy.
                    </Trans>
                </p>
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
