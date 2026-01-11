import { Trans } from '@lingui/react/macro';
import { Users } from 'lucide-react';

import { Badge } from '../../../ui/badge';
import { Motion } from '../motion/motion';

import { DebtSectionFeature } from './debt-section-feature';

const initialMotion = { opacity: 0, y: 20 };
const animatedMotion = { opacity: 1, y: 0 };
const transitionMotion = { duration: 0.5 };
const viewportOnce = { once: true };

export const DebtSectionContent = () => (
    <Motion
        className="order-1 lg:order-2"
        initial={initialMotion}
        transition={transitionMotion}
        viewport={viewportOnce}
        whileInView={animatedMotion}
    >
        <Badge className="rounded-full px-4 py-1.5 text-sm font-medium mb-6" variant="secondary">
            <Users className="size-3 mr-1" />
            <Trans>Debt Tracking</Trans>
        </Badge>

        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
            <Trans>Never Forget Who Owes What</Trans>
        </h2>

        <p className="text-muted-foreground md:text-lg mb-8">
            <Trans>
                Track personal loans, split bills, and monitor your debt payoff journey. Set return dates, visualize progress, and reach
                financial freedom faster.
            </Trans>
        </p>

        <div className="space-y-4">
            <DebtSectionFeature>
                <Trans>Track money you lent to friends and family</Trans>
            </DebtSectionFeature>
            <DebtSectionFeature>
                <Trans>Monitor what you owe to others</Trans>
            </DebtSectionFeature>
            <DebtSectionFeature>
                <Trans>Set target balances and due dates</Trans>
            </DebtSectionFeature>
            <DebtSectionFeature>
                <Trans>Visualize payoff progress with charts</Trans>
            </DebtSectionFeature>
        </div>
    </Motion>
);
