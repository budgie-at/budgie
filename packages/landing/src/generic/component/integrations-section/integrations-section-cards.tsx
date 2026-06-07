import { IntegrationsSectionBankCard } from './integrations-section-bank-card';
import { IntegrationsSectionCsvCard } from './integrations-section-csv-card';
import { IntegrationsSectionInvestmentsCard } from './integrations-section-investments-card';
import { IntegrationsSectionTransferCard } from './integrations-section-transfer-card';

export const IntegrationsSectionCards = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <IntegrationsSectionBankCard />
        <IntegrationsSectionInvestmentsCard />
        <IntegrationsSectionCsvCard />
        <IntegrationsSectionTransferCard />
    </div>
);
