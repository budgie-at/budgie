import { InstrumentTypeEnum } from '@budgie/contracts';

export const isListedSecurityType = (type: InstrumentTypeEnum | null): boolean =>
    type === InstrumentTypeEnum.EQUITY || type === InstrumentTypeEnum.ETF;
