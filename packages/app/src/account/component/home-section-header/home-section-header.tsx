import { HomeAccountBalanceSummaryInterface } from '../../interface/home-account-balance-summary.interface';
import { HomeSectionInterface } from '../../interface/home-section.interface';
import { isBankProviderSection } from '../../type-guard/is-bank-provider-section.type-guard';
import { isDebtSection } from '../../type-guard/is-debt-section.type-guard';
import { AccountSectionHeader } from '../account-section-header/account-section-header';
import { BankProviderSectionHeader } from '../bank-provider-section-header/bank-provider-section-header';
import { DebtSectionHeader } from '../debt-section-header/debt-section-header';

interface Props {
    readonly section: HomeSectionInterface;
    readonly balanceSummary: HomeAccountBalanceSummaryInterface;
}

export const HomeSectionHeader = ({ section, balanceSummary }: Props) => {
    if (isBankProviderSection(section)) {
        const total = balanceSummary.bankProviderTotals.get(section.integrationId) ?? 0;

        return <BankProviderSectionHeader provider={section.provider} integrationId={section.integrationId} total={total} />;
    }

    if (isDebtSection(section)) {
        const total = balanceSummary.debtSectionTotals.get(section.kind) ?? 0;

        return <DebtSectionHeader sectionKind={section.kind} total={total} />;
    }

    const total = balanceSummary.accountTypeTotals.get(section.type) ?? 0;

    return <AccountSectionHeader type={section.type} total={total} />;
};
