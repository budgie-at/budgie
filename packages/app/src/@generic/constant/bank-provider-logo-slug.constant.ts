import { ExternalSourceEnum } from '@budgie/contracts';

export const BANK_PROVIDER_LOGO_SLUG: Partial<Readonly<Record<ExternalSourceEnum, string>>> = {
    [ExternalSourceEnum.BINANCE]: 'binance',
    [ExternalSourceEnum.ERSTE]: 'erste-bank',
    [ExternalSourceEnum.MONOBANK]: 'monobank',
    [ExternalSourceEnum.PRIVATBANK]: 'privatbank'
};
