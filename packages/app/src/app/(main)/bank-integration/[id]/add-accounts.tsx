import { ExternalSourceEnum } from '@budgie/contracts';
import { Redirect } from 'expo-router';

import { AddBankIntegrationAccounts } from '../../../../sync/component/add-bank-integration-accounts/add-bank-integration-accounts';
import { BankIntegrationRouteGuard } from '../../../../sync/component/bank-integration-route-guard/bank-integration-route-guard';

export default function AddBankIntegrationAccountsRoute() {
    return (
        <BankIntegrationRouteGuard>
            {integration =>
                integration.provider === ExternalSourceEnum.MONOBANK ? (
                    <AddBankIntegrationAccounts integration={integration} />
                ) : (
                    <Redirect href={`/bank-integration/${integration.id}`} />
                )
            }
        </BankIntegrationRouteGuard>
    );
}
