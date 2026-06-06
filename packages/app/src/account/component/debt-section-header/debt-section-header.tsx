import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { DEBT_SECTION_KIND_LABEL } from '../../constant/debt-section-kind-label.constant';
import { HomeSectionKindEnum } from '../../enum/home-section-kind.enum';
import { AccountSectionHeaderFrame } from '../account-section-header-frame/account-section-header-frame';

interface Props {
    readonly sectionKind: HomeSectionKindEnum.DEBT_YOU_OWE | HomeSectionKindEnum.DEBT_OWED_TO_YOU;
    readonly total: number;
}

export const DebtSectionHeader = ({ sectionKind, total }: Props) => {
    const { t } = useLingui();

    return (
        <AccountSectionHeaderFrame total={total}>
            <Text className="text-xs uppercase text-secondary-foreground">{t(DEBT_SECTION_KIND_LABEL[sectionKind])}</Text>
        </AccountSectionHeaderFrame>
    );
};
