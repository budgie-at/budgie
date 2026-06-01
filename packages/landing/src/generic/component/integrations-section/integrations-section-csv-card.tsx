import { Trans } from '@lingui/react/macro';
import { FileSpreadsheet } from 'lucide-react';

import { Badge } from '../../../ui/badge';

import { IntegrationsSectionCard } from './integrations-section-card';

export const IntegrationsSectionCsvCard = () => (
    <IntegrationsSectionCard
        badges={
            <>
                <Badge variant="outline">
                    <Trans>Custom Mapping</Trans>
                </Badge>
                <Badge variant="outline">
                    <Trans>Save Presets</Trans>
                </Badge>
                <Badge variant="outline">
                    <Trans>Bulk Import</Trans>
                </Badge>
            </>
        }
        cardClassName="bg-linear-to-b from-background to-green-50/50 dark:to-green-950/20"
        delay={0.2}
        description={<Trans>Import from any app with flexible column mapping.</Trans>}
        icon={<FileSpreadsheet className="size-6 text-green-600 dark:text-green-400" />}
        iconClassName="bg-green-100 dark:bg-green-900/30"
        title={<Trans>CSV Import</Trans>}
    />
);
