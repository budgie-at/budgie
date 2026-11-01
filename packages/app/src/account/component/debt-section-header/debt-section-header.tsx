import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { HomeSectionKindEnum } from '../../enum/home-section-kind.enum';
import { AccountSectionHeaderFrame } from '../account-section-header-frame/account-section-header-frame';

interface Props {
    readonly sectionKind: HomeSectionKindEnum.DEBT_YOU_OWE | HomeSectionKindEnum.DEBT_OWED_TO_YOU;
    readonly total: number;
}

const DEBT_SECTION_KIND_LABEL: Record<HomeSectionKindEnum.DEBT_YOU_OWE | HomeSectionKindEnum.DEBT_OWED_TO_YOU, MessageDescriptor> = {
    [HomeSectionKindEnum.DEBT_YOU_OWE]: msg`You owe`,
    [HomeSectionKindEnum.DEBT_OWED_TO_YOU]: msg`Owed to you`
};

export const DebtSectionHeader = ({ sectionKind, total }: Props) => {
    const { t } = useLingui();

    return <AccountSectionHeaderFrame title={t(DEBT_SECTION_KIND_LABEL[sectionKind])} total={total} />;
};
