import { ExternalSourceEnum } from '../enum/external-source.enum';

const NON_BANK_EXTERNAL_SOURCES = new Set([
    ExternalSourceEnum.MANUAL,
    ExternalSourceEnum.APPLE_PAY_AUTOMATION,
    ExternalSourceEnum.CSV,
    ExternalSourceEnum.RECEIPT,
    ExternalSourceEnum.COINBASE,
    ExternalSourceEnum.BINANCE,
    ExternalSourceEnum.INZHUR,
    ExternalSourceEnum.BROKERAGE_FUNDING
]);

export const BANK_EXTERNAL_SOURCES: readonly ExternalSourceEnum[] = Object.values(ExternalSourceEnum).filter(
    source => !NON_BANK_EXTERNAL_SOURCES.has(source)
);
