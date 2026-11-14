import { YieldGroupEnum } from '@budgie/market';

export const YIELD_STACK_GROUPS = [
    YieldGroupEnum.STAKING_EARN,
    YieldGroupEnum.INTEREST,
    YieldGroupEnum.DIVIDENDS,
    YieldGroupEnum.DISTRIBUTIONS
] as const;
