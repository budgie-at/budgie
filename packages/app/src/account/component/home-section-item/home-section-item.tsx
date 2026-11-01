import { AccountWithSyncEntityInterface } from '@budgie/contracts';

import { TransactionRowSurface } from '../../../transaction/components/transaction-row-surface/transaction-row-surface';
import { TransactionListRowPositionEnum } from '../../../transaction/enum/transaction-list-row-position.enum';
import { AccountRowLeadingContext } from '../../context/account-row-leading.context';
import { CryptoCurrencyGroupInterface } from '../../interface/crypto-currency-group.interface';
import { HomeAccountBalanceSummaryInterface } from '../../interface/home-account-balance-summary.interface';
import { HomeSectionInterface } from '../../interface/home-section.interface';
import { InstitutionGroupInterface } from '../../interface/institution-group.interface';
import { isDebtSection } from '../../type-guard/is-debt-section.type-guard';
import { AccountListItem } from '../account-list-item/account-list-item';
import { CryptoCurrencyGroupCard } from '../crypto-currency-group-card/crypto-currency-group-card';
import { DebtAccountCard } from '../debt-account-card/debt-account-card';
import { InstitutionMark } from '../institution-mark/institution-mark';
import { InstitutionRow } from '../institution-row/institution-row';

interface Props {
    readonly item: CryptoCurrencyGroupInterface | InstitutionGroupInterface | AccountWithSyncEntityInterface;
    readonly section: HomeSectionInterface;
    readonly balanceSummary: HomeAccountBalanceSummaryInterface;
    readonly position: TransactionListRowPositionEnum;
}

export const HomeSectionItem = ({ item, section, balanceSummary, position }: Props) => {
    const { balancesByAccountId, bankProviderTotals } = balanceSummary;

    if ('provider' in item && item.accounts.length === 1) {
        const [account] = item.accounts;

        return (
            <TransactionRowSurface position={position}>
                <AccountRowLeadingContext value={<InstitutionMark provider={item.provider} title={account.title} />}>
                    <AccountListItem account={account} type={account.type} balancesByAccountId={balancesByAccountId} />
                </AccountRowLeadingContext>
            </TransactionRowSurface>
        );
    }

    if ('provider' in item) {
        return (
            <TransactionRowSurface position={position}>
                <InstitutionRow institution={item} total={bankProviderTotals.get(item.integrationId) ?? 0} />
            </TransactionRowSurface>
        );
    }

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

    return (
        <TransactionRowSurface position={position}>
            <AccountListItem account={item} type={section.type} balancesByAccountId={balancesByAccountId} />
        </TransactionRowSurface>
    );
};
