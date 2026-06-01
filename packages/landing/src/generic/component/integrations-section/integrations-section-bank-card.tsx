import { Trans } from '@lingui/react/macro';
import { Building2 } from 'lucide-react';

import { Badge } from '../../../ui/badge';

import { IntegrationsSectionCard } from './integrations-section-card';

export const IntegrationsSectionBankCard = () => (
    <IntegrationsSectionCard
        badges={
            <>
                <Badge variant="outline">
                    <Trans>Monobank</Trans>
                </Badge>
                <Badge variant="outline">
                    <Trans>PrivatBank</Trans>
                </Badge>
                <Badge variant="outline">
                    <Trans>Erste Bank</Trans>
                </Badge>
            </>
        }
        cardClassName="bg-linear-to-b from-background to-blue-50/50 dark:to-blue-950/20"
        description={
            <Trans>Direct Monobank API sync, plus PDF/Excel/CSV imports for any bank in the world. No aggregator in the middle.</Trans>
        }
        icon={<Building2 className="size-6 text-blue-600 dark:text-blue-400" />}
        iconClassName="bg-blue-100 dark:bg-blue-900/30"
        title={<Trans>Bank Integrations</Trans>}
    />
);
