import { Trans, useLingui } from '@lingui/react/macro';
import { Banknote, Layers, Shield, Target, TrendingUp, WifiOff } from 'lucide-react';

import { Badge } from '../../../ui/badge';
import { FeaturesSectionItem } from '../features-section-item/features-section-item';
import { Motion } from '../motion/motion';

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const initialMotion = { opacity: 0, y: 20 };
const animatedMotion = { opacity: 1, y: 0 };
const transitionMotion = { duration: 0.5 };
const viewportOnce = { once: true };

export const FeaturesSection = () => {
    const { t } = useLingui();

    return (
        <section className="w-full py-20 md:py-32" id="features">
            <div className="container px-4 md:px-6">
                <Motion
                    className="flex flex-col items-center justify-center space-y-4 text-center mb-12"
                    initial={initialMotion}
                    transition={transitionMotion}
                    viewport={viewportOnce}
                    whileInView={animatedMotion}
                >
                    <Badge className="rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
                        <Trans>Features</Trans>
                    </Badge>

                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                        <Trans>Everything You Need to Master Your Finances</Trans>
                    </h2>

                    <p className="max-w-[800px] text-muted-foreground md:text-lg">
                        <Trans>
                            Budgie combines powerful expense tracking with complete privacy. Track every dollar, euro, or bitcoin while
                            keeping your financial data exactly where it belongs—on your device.
                        </Trans>
                    </p>
                </Motion>

                <Motion
                    className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                    initial="hidden"
                    variants={containerVariants}
                    viewport={viewportOnce}
                    whileInView="show"
                >
                    <FeaturesSectionItem
                        description={t`Track expenses anywhere, anytime. Your data syncs when you're back online.`}
                        icon={<WifiOff className="size-5" />}
                        title={t`Offline-First Design`}
                    />

                    <FeaturesSectionItem
                        description={t`Automatically import transactions from your bank accounts for effortless tracking.`}
                        icon={<Banknote className="size-5" />}
                        title={t`Bank Synchronization`}
                    />

                    <FeaturesSectionItem
                        description={t`Monitor cash, crypto, stocks, and bank accounts all in one place.`}
                        icon={<Layers className="size-5" />}
                        title={t`Multi-Asset Tracking`}
                    />

                    <FeaturesSectionItem
                        description={t`Your financial data stays on your device. No cloud storage, no data mining.`}
                        icon={<Shield className="size-5" />}
                        title={t`Complete Privacy`}
                    />

                    <FeaturesSectionItem
                        description={t`Track expenses in any currency with real-time exchange rates.`}
                        icon={<TrendingUp className="size-5" />}
                        title={t`Multi-Currency Support`}
                    />

                    <FeaturesSectionItem
                        description={t`Set financial goals and track debt payments to achieve financial freedom.`}
                        icon={<Target className="size-5" />}
                        title={t`Goals & Debt Tracking`}
                    />
                </Motion>
            </div>
        </section>
    );
};
