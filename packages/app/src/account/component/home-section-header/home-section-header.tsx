import { HOLDING_SECTION_TYPES } from '../../constant/holding-section-types.constant';
import { HomeSectionKindEnum } from '../../enum/home-section-kind.enum';
import { HomeHoldingReturnsInterface } from '../../interface/home-holding-returns.interface';
import { HomeSectionInterface } from '../../interface/home-section.interface';
import { isDebtSection } from '../../type-guard/is-debt-section.type-guard';
import { isHomeHolding } from '../../type-guard/is-home-holding.type-guard';
import { AccountSectionHeader } from '../account-section-header/account-section-header';
import { DebtSectionHeader } from '../debt-section-header/debt-section-header';
import { FamilySectionHeader } from '../family-section-header/family-section-header';
import { HomeSectionReturnLine } from '../home-section-return-line/home-section-return-line';

import { HomeSectionHeaderSelector } from './home-section-header.selector';

interface Props {
    readonly section: HomeSectionInterface;
    readonly holdingReturns: HomeHoldingReturnsInterface;
}

export const HomeSectionHeader = ({ section, holdingReturns }: Props) => {
    const total = section.data.length === 1 ? null : section.total;

    if (section.kind === HomeSectionKindEnum.FAMILY) {
        return <FamilySectionHeader total={total} />;
    }

    if (isDebtSection(section)) {
        return <DebtSectionHeader sectionKind={section.kind} total={total} />;
    }

    const hasReturnLine = HOLDING_SECTION_TYPES.includes(section.type) && section.data.some(isHomeHolding);

    return (
        <AccountSectionHeader type={section.type} total={total}>
            {hasReturnLine ? (
                <HomeSectionReturnLine
                    sectionReturn={holdingReturns.bySectionType.get(section.type)}
                    isLoading={holdingReturns.isLoading}
                    testID={HomeSectionHeaderSelector.Return(section.type)}
                />
            ) : null}
        </AccountSectionHeader>
    );
};
