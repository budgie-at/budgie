import { AccountDebtTypeEnum } from '@budgie/contracts';

import { HomeSectionKindEnum } from '../../enum/home-section-kind.enum';
import { HomeAccountBalanceSummaryInterface } from '../../interface/home-account-balance-summary.interface';
import { HomeSectionInterface } from '../../interface/home-section.interface';
import { isBankProviderSection } from '../../type-guard/is-bank-provider-section.type-guard';
import { isDebtSection } from '../../type-guard/is-debt-section.type-guard';
import { buildBankProviderGroupKey } from '../../utils/build-bank-provider-group-key.util';
import { AccountSectionHeader } from '../account-section-header/account-section-header';
import { BankProviderSectionHeader } from '../bank-provider-section-header/bank-provider-section-header';
import { DebtSectionHeader } from '../debt-section-header/debt-section-header';

interface Props {
    readonly section: HomeSectionInterface;
    readonly balanceSummary: HomeAccountBalanceSummaryInterface;
}

const SECTION_KIND_TO_DEBT_TYPE: Record<HomeSectionKindEnum.DEBT_YOU_OWE | HomeSectionKindEnum.DEBT_OWED_TO_YOU, AccountDebtTypeEnum> = {
    [HomeSectionKindEnum.DEBT_OWED_TO_YOU]: AccountDebtTypeEnum.LENT,
    [HomeSectionKindEnum.DEBT_YOU_OWE]: AccountDebtTypeEnum.BORROW
};

export const HomeSectionHeader = ({ section, balanceSummary }: Props) => {
    if (isBankProviderSection(section)) {
        const total = balanceSummary.bankProviderTotals.get(buildBankProviderGroupKey(section.integrationId, section.provider)) ?? 0;

        return <BankProviderSectionHeader provider={section.provider} integrationId={section.integrationId} total={total} />;
    }

    if (isDebtSection(section)) {
        const debtType = SECTION_KIND_TO_DEBT_TYPE[section.kind];
        const total = balanceSummary.debtTypeTotals.get(debtType) ?? 0;

        return <DebtSectionHeader sectionKind={section.kind} total={total} />;
    }

    const total = balanceSummary.accountTypeTotals.get(section.type) ?? 0;

    return <AccountSectionHeader type={section.type} total={total} />;
};
