import { Trans } from '@lingui/react/macro';
import { GitMerge } from 'lucide-react';

import { Badge } from '../../../ui/badge';

import { IntegrationsSectionCard } from './integrations-section-card';

export const IntegrationsSectionTransferCard = () => (
    <IntegrationsSectionCard
        badges={
            <>
                <Badge variant="outline">
                    <Trans>Counter-IBAN</Trans>
                </Badge>
                <Badge variant="outline">
                    <Trans>FX Tolerance</Trans>
                </Badge>
                <Badge variant="outline">
                    <Trans>Auto-Pair</Trans>
                </Badge>
            </>
        }
        cardClassName="bg-linear-to-b from-background to-purple-50/50 dark:to-purple-950/20"
        delay={0.3}
        description={
            <Trans>
                When you send money between two banks, Budgie auto-pairs both legs using counter-IBAN matching plus exchange-rate tolerance
                — no duplicate expenses, no manual merging.
            </Trans>
        }
        icon={<GitMerge className="size-6 text-purple-600 dark:text-purple-400" />}
        iconClassName="bg-purple-100 dark:bg-purple-900/30"
        title={<Trans>Transfer Detection</Trans>}
    />
);
