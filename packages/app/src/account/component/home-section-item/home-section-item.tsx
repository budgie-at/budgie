import { AccountTypeEnum } from '@budgie/contracts';

import { AccountRowInterface } from '../../interface/account-row.interface';
import { CryptoCurrencyGroupInterface } from '../../interface/crypto-currency-group.interface';
import { HomeAccountBalanceSummaryInterface } from '../../interface/home-account-balance-summary.interface';
import { isBankProviderSection } from '../../type-guard/is-bank-provider-section.type-guard';
import { isCryptoCurrencyGroup } from '../../type-guard/is-crypto-currency-group.type-guard';
import { isDebtSection } from '../../type-guard/is-debt-section.type-guard';
import { HomeSectionInterface } from '../../utils/build-home-page-sections.util';
import { AccountGridRow } from '../account-grid-row/account-grid-row';
import { CryptoCurrencyGroupCard } from '../crypto-currency-group-card/crypto-currency-group-card';

interface Props {
    readonly item: AccountRowInterface | CryptoCurrencyGroupInterface;
    readonly section: HomeSectionInterface;
    readonly balanceSummary: HomeAccountBalanceSummaryInterface;
}

export const HomeSectionItem = ({ item, section, balanceSummary }: Props) => {
    if (isCryptoCurrencyGroup(item)) {
        const balance = item.accounts.reduce(
            (total, account) => total + (balanceSummary.balancesByAccountId.get(account.id)?.balance ?? 0),
            0
        );

        return <CryptoCurrencyGroupCard group={item} balance={balance} balancesByAccountId={balanceSummary.balancesByAccountId} />;
    }

    if (isBankProviderSection(section)) {
        return (
            <AccountGridRow
                row={item}
                accountType={AccountTypeEnum.BANK_SYNC}
                balancesByAccountId={balanceSummary.balancesByAccountId}
                className="mb-3"
            />
        );
    }

    if (isDebtSection(section)) {
        return (
            <AccountGridRow
                row={item}
                accountType={AccountTypeEnum.DEBT}
                balancesByAccountId={balanceSummary.balancesByAccountId}
                className="mb-3"
            />
        );
    }

    return (
        <AccountGridRow row={item} accountType={section.type} balancesByAccountId={balanceSummary.balancesByAccountId} className="mb-3" />
    );
};
