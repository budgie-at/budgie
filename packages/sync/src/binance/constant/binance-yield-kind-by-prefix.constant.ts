import { YieldKindEnum } from '@budgie/contracts';

export const BINANCE_YIELD_KIND_BY_PREFIX: Readonly<Record<string, YieldKindEnum>> = {
    'binance:earn:': YieldKindEnum.EARN,
    'binance:earn-locked:': YieldKindEnum.EARN,
    'binance:eth-staking:': YieldKindEnum.STAKING,
    'binance:dividend:': YieldKindEnum.DISTRIBUTION
};
