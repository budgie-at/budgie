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
                        <Badge variant="outline">{t`Revolut`}</Badge>
                        <Badge variant="outline">{t`Wise`}</Badge>
                    </>
                }
                cardClassName="bg-linear-to-b from-background to-blue-50/50 dark:to-blue-950/20"
                description={<Trans>Sync with major banks and financial institutions automatically.</Trans>}
                icon={<Building2 className="size-6 text-blue-600 dark:text-blue-400" />}
                iconClassName="bg-blue-100 dark:bg-blue-900/30"
                title={<Trans>Traditional Banks</Trans>}
            />

            <IntegrationsSectionCard
                badges={
                    <>
                        <Badge variant="outline">{t`Binance`}</Badge>
                        <Badge variant="outline">{t`Coinbase`}</Badge>
                        <Badge variant="outline">{t`DeFi Wallets`}</Badge>
                    </>
                }
                cardClassName="bg-linear-to-b from-background to-orange-50/50 dark:to-orange-950/20"
                delay={0.1}
                description={<Trans>Track your crypto portfolio across all major exchanges.</Trans>}
                icon={<Bitcoin className="size-6 text-orange-600 dark:text-orange-400" />}
                iconClassName="bg-orange-100 dark:bg-orange-900/30"
                title={<Trans>Crypto Exchanges</Trans>}
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
