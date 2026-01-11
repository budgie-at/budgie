import { Trans } from '@lingui/react/macro';
import { Banknote, CreditCard, RefreshCw, Wallet } from 'lucide-react';

import { Motion } from '../motion/motion';

import { IntegrationsSectionFeature } from './integrations-section-feature';

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const viewportOnce = { once: true };

export const IntegrationsSectionFeatures = () => (
    <Motion
        className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
        initial="hidden"
        variants={containerVariants}
        viewport={viewportOnce}
        whileInView="show"
    >
        <IntegrationsSectionFeature icon={<CreditCard className="size-5 text-primary" />} label={<Trans>Multiple Cards</Trans>} />
        <IntegrationsSectionFeature icon={<Wallet className="size-5 text-primary" />} label={<Trans>Cash Tracking</Trans>} />
        <IntegrationsSectionFeature icon={<RefreshCw className="size-5 text-primary" />} label={<Trans>Auto Sync</Trans>} />
        <IntegrationsSectionFeature icon={<Banknote className="size-5 text-primary" />} label={<Trans>Savings Accounts</Trans>} />
    </Motion>
);
