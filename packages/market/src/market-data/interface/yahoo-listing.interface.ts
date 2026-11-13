import type { InstrumentTypeEnum } from '@budgie/contracts';

export interface YahooListingInterface {
    readonly symbol: string;
    readonly name: string;
    readonly exchange: string;
    readonly type: InstrumentTypeEnum.EQUITY | InstrumentTypeEnum.ETF;
}
