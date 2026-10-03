import { DebtAccountGroupInterface } from '../../interface/debt-account-group.interface';
import { HomeAccountBalanceInterface } from '../../interface/home-account-balance.interface';
import { DebtAccountCard } from '../debt-account-card/debt-account-card';

interface Props {
    readonly group: DebtAccountGroupInterface;
    readonly balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>;
}

export const DebtAccountGroupCard = ({ group, balancesByAccountId }: Props) =>
    group.debtAccounts.map(account => (
        <DebtAccountCard
            key={account.id}
            account={account}
            instrumentSymbol={account.instrument.symbol}
            debtProgressSummary={balancesByAccountId.get(account.id)?.debtProgressSummary ?? null}
        />
    ));
