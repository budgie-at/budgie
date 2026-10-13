import { StartDepositAccount } from '../../../../account/component/start-deposit-account/start-deposit-account';
import { TransactionInfoRoute } from '../../../../transaction/components/transaction-info-route/transaction-info-route';

export default function StartDepositRoute() {
    return <TransactionInfoRoute>{transaction => <StartDepositAccount transaction={transaction} />}</TransactionInfoRoute>;
}
