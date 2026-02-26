import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

import { HomeSectionKindEnum } from '../enum/home-section-kind.enum';

export const DEBT_SECTION_KIND_LABEL: Record<HomeSectionKindEnum.DEBT_YOU_OWE | HomeSectionKindEnum.DEBT_OWED_TO_YOU, MessageDescriptor> = {
    [HomeSectionKindEnum.DEBT_YOU_OWE]: msg`You owe`,
    [HomeSectionKindEnum.DEBT_OWED_TO_YOU]: msg`Owed to you`
};
