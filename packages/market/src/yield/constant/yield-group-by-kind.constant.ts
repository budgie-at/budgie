import { YieldKindEnum } from '@budgie/contracts';

import { YieldGroupEnum } from '../enum/yield-group.enum';

export const YIELD_GROUP_BY_KIND: Readonly<Record<YieldKindEnum, YieldGroupEnum | null>> = {
    [YieldKindEnum.STAKING]: YieldGroupEnum.STAKING_EARN,
    [YieldKindEnum.EARN]: YieldGroupEnum.STAKING_EARN,
    [YieldKindEnum.INTEREST]: YieldGroupEnum.INTEREST,
    [YieldKindEnum.DIVIDEND]: YieldGroupEnum.DIVIDENDS,
    [YieldKindEnum.DISTRIBUTION]: YieldGroupEnum.DISTRIBUTIONS,
    [YieldKindEnum.TAX]: YieldGroupEnum.TAX,
    [YieldKindEnum.NONE]: null
};
