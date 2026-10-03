import { Card } from '../../../@generic/component/card/card';
import { DebtAccountGroupInterface } from '../../interface/debt-account-group.interface';
import { HomeAccountBalanceInterface } from '../../interface/home-account-balance.interface';
import { DebtAccountGroupRow } from '../debt-account-group-row/debt-account-group-row';

interface Props {
    readonly group: DebtAccountGroupInterface;
    readonly balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>;
}

export const DebtAccountGroupCard = ({ group, balancesByAccountId }: Props) => (
    <Card className="mb-3 overflow-hidden p-0">
        {group.debtAccounts.map((account, index) => (
            <DebtAccountGroupRow
                key={account.id}
                account={account}
                debtProgressSummary={balancesByAccountId.get(account.id)?.debtProgressSummary ?? null}
                index={index}
            />
        ))}
    </Card>
);
