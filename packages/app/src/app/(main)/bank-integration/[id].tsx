import { BankIntegrationPage } from '../../../sync/component/bank-integration-page/bank-integration-page';
import { BankIntegrationRouteGuard } from '../../../sync/component/bank-integration-route-guard/bank-integration-route-guard';

export default function BankIntegrationRoute() {
    return <BankIntegrationRouteGuard>{integration => <BankIntegrationPage integration={integration} />}</BankIntegrationRouteGuard>;
}
