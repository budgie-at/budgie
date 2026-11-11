import { HomeSectionKindEnum } from '../../enum/home-section-kind.enum';
import { HomeSectionInterface } from '../../interface/home-section.interface';
import { isDebtSection } from '../../type-guard/is-debt-section.type-guard';
import { AccountSectionHeader } from '../account-section-header/account-section-header';
import { DebtSectionHeader } from '../debt-section-header/debt-section-header';
import { FamilySectionHeader } from '../family-section-header/family-section-header';

interface Props {
    readonly section: HomeSectionInterface;
}

export const HomeSectionHeader = ({ section }: Props) => {
    const total = section.data.length === 1 ? null : section.total;

    if (section.kind === HomeSectionKindEnum.FAMILY) {
        return <FamilySectionHeader total={total} />;
    }

    if (isDebtSection(section)) {
        return <DebtSectionHeader sectionKind={section.kind} total={total} />;
    }

    return <AccountSectionHeader type={section.type} total={total} />;
};
