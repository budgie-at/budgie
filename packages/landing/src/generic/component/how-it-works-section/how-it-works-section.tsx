import { Trans, useLingui } from '@lingui/react/macro';

import { Badge } from '../../../ui/badge';
import { HowItWorksSectionStep } from '../how-it-works-section-step/how-it-works-section-step';
import { Motion } from '../motion/motion';

const initialMotion = { opacity: 0, y: 20 };
const animatedMotion = { opacity: 1, y: 0 };
const transitionMotion = { duration: 0.5 };
const viewport = { once: true };

export const HowItWorksSection = () => {
    const { t } = useLingui();

    return (
        <section className="w-full py-20 md:py-32 bg-muted/30 relative overflow-hidden">
            <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_80%_50%_at_50%_50%,#000_40%,transparent_100%)]" />

            <div className="container px-4 md:px-6 relative">
                <Motion
                    className="flex flex-col items-center justify-center space-y-4 text-center mb-16"
                    initial={initialMotion}
                    transition={transitionMotion}
                    viewport={viewport}
                    whileInView={animatedMotion}
                >
                    <Badge className="rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
                        <Trans>How It Works</Trans>
                    </Badge>

                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                        <Trans>Start Tracking in Minutes</Trans>
                    </h2>

                    <p className="max-w-[800px] text-muted-foreground md:text-lg">
                        <Trans>
                            Get complete control over your finances with just a few simple steps. No accounts, no cloud storage, no
                            compromises.
                        </Trans>
                    </p>
                </Motion>

                <div className="grid md:grid-cols-3 gap-8 md:gap-12 relative">
                    <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-border to-transparent -translate-y-1/2 z-0" />

                    <HowItWorksSectionStep
                        description={t`Get Budgie from the app store. No registration required—your privacy starts immediately.`}
                        index={0}
                        step="01"
                        title={t`Download & Install`}
                    />

                    <HowItWorksSectionStep
                        description={t`Securely link your bank accounts, crypto wallets, and investment accounts for automatic tracking.`}
                        index={1}
                        step="02"
                        title={t`Connect Your Accounts`}
                    />

                    <HowItWorksSectionStep
                        description={t`Monitor expenses, set goals, track debts, and gain insights—all while keeping your data private.`}
                        index={2}
                        step="03"
                        title={t`Track Everything`}
                    />
                </div>
            </div>
        </section>
    );
};
