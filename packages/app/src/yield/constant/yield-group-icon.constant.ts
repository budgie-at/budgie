import { UserIconNameEnum } from '@budgie/contracts';
import { YieldGroupEnum } from '@budgie/market';

export const YIELD_GROUP_ICON: Readonly<Record<YieldGroupEnum, UserIconNameEnum>> = {
    [YieldGroupEnum.STAKING_EARN]: UserIconNameEnum.Layers,
    [YieldGroupEnum.INTEREST]: UserIconNameEnum.Percent,
    [YieldGroupEnum.DIVIDENDS]: UserIconNameEnum.ChartPie,
    [YieldGroupEnum.DISTRIBUTIONS]: UserIconNameEnum.HandCoins,
    [YieldGroupEnum.TAX]: UserIconNameEnum.Receipt
};
