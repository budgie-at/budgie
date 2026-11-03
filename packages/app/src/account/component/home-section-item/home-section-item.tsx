import { AccountWithSyncEntityInterface } from '@budgie/contracts';

import { AccountRowLeadingContext } from '../../context/account-row-leading.context';
import { CryptoCurrencyGroupInterface } from '../../interface/crypto-currency-group.interface';
import { HomeAccountBalanceInterface } from '../../interface/home-account-balance.interface';
import { HomeSectionInterface } from '../../interface/home-section.interface';
import { InstitutionGroupInterface } from '../../interface/institution-group.interface';
import { isDebtSection } from '../../type-guard/is-debt-section.type-guard';
import { isInstitutionGroup } from '../../type-guard/is-institution-group.type-guard';
import { AccountListItem } from '../account-list-item/account-list-item';
import { CryptoCurrencyGroupCard } from '../crypto-currency-group-card/crypto-currency-group-card';
import { DebtAccountCard } from '../debt-account-card/debt-account-card';
import { InstitutionMark } from '../institution-mark/institution-mark';
import { InstitutionRow } from '../institution-row/institution-row';

interface Props {
    readonly item: CryptoCurrencyGroupInterface | InstitutionGroupInterface | AccountWithSyncEntityInterface;
    readonly section: HomeSectionInterface;
    readonly balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>;
}

export const HomeSectionItem = ({ item, section, balancesByAccountId }: Props) => {
    if (isInstitutionGroup(item) && item.accounts.length === 1) {
        const [account] = item.accounts;

        return (
            <AccountRowLeadingContext value={<InstitutionMark provider={item.provider} title={account.title} />}>
                <AccountListItem account={account} balancesByAccountId={balancesByAccountId} />
            </AccountRowLeadingContext>
        );
    }

    if (isInstitutionGroup(item)) {
        return <InstitutionRow institution={item} />;
    }

    if ('accounts' in item) {
        const balance = item.accounts.reduce((total, account) => total + (balancesByAccountId.get(account.id)?.balance ?? 0), 0);

        return <CryptoCurrencyGroupCard group={item} balance={balance} balancesByAccountId={balancesByAccountId} />;
    }

    if (isDebtSection(section)) {
        return (
            <DebtAccountCard
                account={item}
                instrumentSymbol={item.instrument.symbol}
                debtProgressSummary={balancesByAccountId.get(item.id)?.debtProgressSummary ?? null}
            />
        );
    }

    return <AccountListItem account={item} balancesByAccountId={balancesByAccountId} />;
};
