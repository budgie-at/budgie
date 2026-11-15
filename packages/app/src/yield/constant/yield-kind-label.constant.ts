import { YieldKindEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';

import type { MessageDescriptor } from '@lingui/core';

export const YIELD_KIND_LABEL: Readonly<Record<YieldKindEnum, MessageDescriptor>> = {
    [YieldKindEnum.STAKING]: msg`Staking`,
    [YieldKindEnum.EARN]: msg`Earn`,
    [YieldKindEnum.DISTRIBUTION]: msg`Distribution`,
    [YieldKindEnum.DIVIDEND]: msg`Dividend`,
    [YieldKindEnum.INTEREST]: msg`Interest`,
    [YieldKindEnum.TAX]: msg`Tax withheld`,
    [YieldKindEnum.NONE]: msg`Not passive income`
};
