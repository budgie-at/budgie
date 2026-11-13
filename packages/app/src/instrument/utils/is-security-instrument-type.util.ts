import { InstrumentTypeEnum } from '@budgie/contracts';

export const isSecurityInstrumentType = (type: InstrumentTypeEnum): boolean =>
    type === InstrumentTypeEnum.FUND || type === InstrumentTypeEnum.EQUITY || type === InstrumentTypeEnum.ETF;
