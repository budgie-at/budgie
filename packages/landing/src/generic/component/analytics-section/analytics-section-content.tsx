import { Trans } from '@lingui/react/macro';
import { AlertTriangle, Calendar, PieChart, Tag } from 'lucide-react';

import { Badge } from '../../../ui/badge';
import { Motion } from '../motion/motion';

import { AnalyticsSectionFeature } from './analytics-section-feature';

const viewportOnce = { once: true };
const leftColumnInitial = { opacity: 0, x: -20 };
const leftColumnAnimate = { opacity: 1, x: 0 };
const leftColumnTransition = { duration: 0.5 };

export const AnalyticsSectionContent = () => (
    <Motion initial={leftColumnInitial} transition={leftColumnTransition} viewport={viewportOnce} whileInView={leftColumnAnimate}>
        <Badge className="rounded-full px-4 py-1.5 text-sm font-medium mb-6 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800">
            <AlertTriangle className="size-3 mr-1" />
            <Trans>Stop the Leaks</Trans>
        </Badge>

        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
            <Trans>See Exactly Where Your Money Disappears</Trans>
        </h2>

        <p className="text-muted-foreground md:text-lg mb-8">
            <Trans>
                That daily coffee? $150/month. Forgotten subscriptions? $80/month. Budgie exposes every spending leak so you can finally
                plug them and keep more money in your pocket.
            </Trans>
        </p>

        <div className="space-y-4">
            <AnalyticsSectionFeature
                description={<Trans>See percentages for food, transport, shopping—know exactly what&apos;s draining your wallet.</Trans>}
                icon={<PieChart className="size-5 text-red-600 dark:text-red-400" />}
                iconClassName="bg-red-100 dark:bg-red-900/30"
                title={<Trans>Spending Breakdown</Trans>}
            />

            <AnalyticsSectionFeature
                description={<Trans>Custom tags reveal trends you never noticed. Discover your real spending triggers.</Trans>}
                icon={<Tag className="size-5 text-orange-600 dark:text-orange-400" />}
                iconClassName="bg-orange-100 dark:bg-orange-900/30"
                title={<Trans>Find Hidden Patterns</Trans>}
            />

            <AnalyticsSectionFeature
                description={<Trans>Compare months, spot improvements, celebrate when you&apos;re winning against overspending.</Trans>}
                icon={<Calendar className="size-5 text-green-600 dark:text-green-400" />}
                iconClassName="bg-green-100 dark:bg-green-900/30"
                title={<Trans>Track Progress Over Time</Trans>}
            />
        </div>
    </Motion>
);
