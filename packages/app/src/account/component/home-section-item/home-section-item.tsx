import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { ACCOUNT_TYPE_SWATCH } from '../../constant/account-type-swatch.constant';
import { AccountRowLeadingContext } from '../../context/account-row-leading.context';
import { HomeAccountBalanceInterface } from '../../interface/home-account-balance.interface';
import { HomeHoldingReturnsInterface } from '../../interface/home-holding-returns.interface';
import { HomeSectionInterface } from '../../interface/home-section.interface';
import { isAccountTypeSection } from '../../type-guard/is-account-type-section.type-guard';
import { isCashSection } from '../../type-guard/is-cash-section.type-guard';
import { isDebtSection } from '../../type-guard/is-debt-section.type-guard';
import { isHomeHolding } from '../../type-guard/is-home-holding.type-guard';
import { isInstitutionGroup } from '../../type-guard/is-institution-group.type-guard';
import { AccountListItem } from '../account-list-item/account-list-item';
import { DebtAccountCard } from '../debt-account-card/debt-account-card';
import { HomeHoldingRow } from '../home-holding-row/home-holding-row';
import { InstitutionRow } from '../institution-row/institution-row';

interface Props {
    readonly item: HomeSectionInterface['data'][number];
    readonly section: HomeSectionInterface;
    readonly balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>;
    readonly holdingReturns: HomeHoldingReturnsInterface;
}

export const HomeSectionItem = ({ item, section, balancesByAccountId, holdingReturns }: Props) => {
    if (
        isInstitutionGroup(item) &&
        item.accounts.length === 1 &&
        item.accounts[0].type !== AccountTypeEnum.STOCKS &&
        !item.isHoldingProvider
    ) {
        const [account] = item.accounts;
        const bankName = item.label ?? account.title;

        return (
            <AccountRowLeadingContext value={<BankLogo bankProvider={item.provider} bankName={bankName} size={44} />}>
                <AccountListItem account={account} balancesByAccountId={balancesByAccountId} />
            </AccountRowLeadingContext>
        );
    }

    if (isInstitutionGroup(item)) {
        return <InstitutionRow institution={item} />;
    }

    if (isHomeHolding(item)) {
        return isAccountTypeSection(section) ? (
            <HomeHoldingRow
                holding={item}
                holdingReturn={holdingReturns.holdingsBySectionType.get(section.type)?.get(item.instrument.id)}
                isReturnLoading={holdingReturns.isLoading}
                sectionType={section.type}
            />
        ) : null;
    }

    if (isCashSection(section) && section.data.length === 1) {
        const cashSwatch = ACCOUNT_TYPE_SWATCH[AccountTypeEnum.CASH];

        return (
            <AccountRowLeadingContext
                value={
                    <CircleIcon
                        icon={UserIconNameEnum.Banknote}
                        size={44}
                        iconSize={22}
                        radius={11}
                        variant="ghost"
                        border={false}
                        className={cashSwatch.soft}
                        iconClassName={cashSwatch.text}
                    />
                }
            >
                <AccountListItem account={item} balancesByAccountId={balancesByAccountId} />
            </AccountRowLeadingContext>
        );
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
