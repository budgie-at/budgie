import { AccountTypeEnum, AccountWithSyncEntityInterface } from '@budgie/contracts';

import { TransactionRowSurface } from '../../../transaction/components/transaction-row-surface/transaction-row-surface';
import { TransactionListRowPositionEnum } from '../../../transaction/enum/transaction-list-row-position.enum';
import { CryptoCurrencyGroupInterface } from '../../interface/crypto-currency-group.interface';
import { HomeAccountBalanceSummaryInterface } from '../../interface/home-account-balance-summary.interface';
import { HomeSectionInterface } from '../../interface/home-section.interface';
import { isBankProviderSection } from '../../type-guard/is-bank-provider-section.type-guard';
import { isDebtSection } from '../../type-guard/is-debt-section.type-guard';
import { AccountListItem } from '../account-list-item/account-list-item';
import { CryptoCurrencyGroupCard } from '../crypto-currency-group-card/crypto-currency-group-card';
import { DebtAccountCard } from '../debt-account-card/debt-account-card';

interface Props {
    readonly item: CryptoCurrencyGroupInterface | AccountWithSyncEntityInterface;
    readonly section: HomeSectionInterface;
    readonly balanceSummary: HomeAccountBalanceSummaryInterface;
    readonly position: TransactionListRowPositionEnum;
}

export const HomeSectionItem = ({ item, section, balanceSummary, position }: Props) => {
    const { balancesByAccountId } = balanceSummary;

    if ('accounts' in item) {
        const balance = item.accounts.reduce((total, account) => total + (balancesByAccountId.get(account.id)?.balance ?? 0), 0);

        return (
            <TransactionRowSurface position={position}>
                <CryptoCurrencyGroupCard group={item} balance={balance} balancesByAccountId={balancesByAccountId} />
            </TransactionRowSurface>
        );
    }

    if (isDebtSection(section)) {
        return (
            <TransactionRowSurface position={position}>
                <DebtAccountCard
                    account={item}
                    instrumentSymbol={item.instrument.symbol}
                    debtProgressSummary={balancesByAccountId.get(item.id)?.debtProgressSummary ?? null}
                />
            </TransactionRowSurface>
        );
    }

    const accountType = isBankProviderSection(section) ? AccountTypeEnum.BANK_SYNC : section.type;

    return (
        <TransactionRowSurface position={position}>
            <AccountListItem account={item} type={accountType} balancesByAccountId={balancesByAccountId} />
        </TransactionRowSurface>
    );
};
