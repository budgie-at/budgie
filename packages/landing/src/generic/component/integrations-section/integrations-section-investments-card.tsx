import { Trans } from '@lingui/react/macro';
import { Bitcoin } from 'lucide-react';

import { Badge } from '../../../ui/badge';

import { IntegrationsSectionCard } from './integrations-section-card';

export const IntegrationsSectionInvestmentsCard = () => (
    <IntegrationsSectionCard
        badges={
            <>
                <Badge variant="outline">
                    <Trans>Bitcoin</Trans>
                </Badge>
                <Badge variant="outline">
                    <Trans>Ethereum</Trans>
                </Badge>
                <Badge variant="outline">
                    <Trans>Stocks &amp; ETFs</Trans>
                </Badge>
            </>
        }
        cardClassName="bg-linear-to-b from-background to-orange-50/50 dark:to-orange-950/20"
        delay={0.1}
        description={
            <Trans>
                Manually track Bitcoin, Ethereum, stocks, ETFs, and any asset. Import positions via CSV. No exchange API connections — your
                data stays on-device.
            </Trans>
        }
        icon={<Bitcoin className="size-6 text-orange-600 dark:text-orange-400" />}
        iconClassName="bg-orange-100 dark:bg-orange-900/30"
        title={<Trans>Crypto & Investments</Trans>}
    />
);
