import { Trans, useLingui } from '@lingui/react/macro';
import { Bitcoin, Building2, FileSpreadsheet } from 'lucide-react';

import { Badge } from '../../../ui/badge';

import { IntegrationsSectionCard } from './integrations-section-card';

export const IntegrationsSectionCards = () => {
    const { t } = useLingui();

    return (
        <div className="grid md:grid-cols-3 gap-6 mb-12">
            <IntegrationsSectionCard
                badges={
                    <>
                        <Badge variant="outline">{t`Monobank`}</Badge>
                        <Badge variant="outline">{t`PrivatBank`}</Badge>
                        <Badge variant="outline">{t`Erste Bank`}</Badge>
                    </>
                }
                cardClassName="bg-linear-to-b from-background to-blue-50/50 dark:to-blue-950/20"
                description={
                    <Trans>
                        Direct Monobank API sync, plus PDF/Excel/CSV imports for any bank in the world. No aggregator in the middle.
                    </Trans>
                }
                icon={<Building2 className="size-6 text-blue-600 dark:text-blue-400" />}
                iconClassName="bg-blue-100 dark:bg-blue-900/30"
                title={<Trans>Bank Integrations</Trans>}
            />

            <IntegrationsSectionCard
                badges={
                    <>
                        <Badge variant="outline">{t`Bitcoin`}</Badge>
                        <Badge variant="outline">{t`Ethereum`}</Badge>
                        <Badge variant="outline">{t`Stocks & ETFs`}</Badge>
                    </>
                }
                cardClassName="bg-linear-to-b from-background to-orange-50/50 dark:to-orange-950/20"
                delay={0.1}
                description={
                    <Trans>
                        Manually track Bitcoin, Ethereum, stocks, ETFs, and any asset. Import positions via CSV. No exchange API connections
                        — your data stays on-device.
                    </Trans>
                }
                icon={<Bitcoin className="size-6 text-orange-600 dark:text-orange-400" />}
                iconClassName="bg-orange-100 dark:bg-orange-900/30"
                title={<Trans>Crypto & Investments</Trans>}
            />

            <IntegrationsSectionCard
                badges={
                    <>
                        <Badge variant="outline">{t`Custom Mapping`}</Badge>
                        <Badge variant="outline">{t`Save Presets`}</Badge>
                        <Badge variant="outline">{t`Bulk Import`}</Badge>
                    </>
                }
                cardClassName="bg-linear-to-b from-background to-green-50/50 dark:to-green-950/20"
                delay={0.2}
                description={<Trans>Import from any app with flexible column mapping.</Trans>}
                icon={<FileSpreadsheet className="size-6 text-green-600 dark:text-green-400" />}
                iconClassName="bg-green-100 dark:bg-green-900/30"
                title={<Trans>CSV Import</Trans>}
            />
        </div>
    );
};
