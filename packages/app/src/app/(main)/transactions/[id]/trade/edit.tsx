import { UpdateSecurityTrade } from '../../../../../brokerage/component/update-security-trade/update-security-trade';
import { UpdateTransactionRoute } from '../../../../../transaction/components/update-transaction-route/update-transaction-route';

export default function EditSecurityTradeRoute() {
    return <UpdateTransactionRoute Component={UpdateSecurityTrade} />;
}
