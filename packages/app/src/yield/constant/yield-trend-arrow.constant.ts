import { YieldHeroTrendEnum } from '../enum/yield-hero-trend.enum';

export const YIELD_TREND_ARROW: Readonly<Record<YieldHeroTrendEnum, string>> = {
    [YieldHeroTrendEnum.UP]: '▲ ',
    [YieldHeroTrendEnum.DOWN]: '▼ ',
    [YieldHeroTrendEnum.NEW]: '',
    [YieldHeroTrendEnum.NONE]: ''
};
