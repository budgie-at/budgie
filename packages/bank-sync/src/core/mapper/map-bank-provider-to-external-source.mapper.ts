import { ExternalSourceEnum } from '@budgie/contracts';

import { BankProviderEnum } from '../enum/bank-provider.enum';

const BANK_PROVIDER_EXTERNAL_SOURCE_MAP: Record<BankProviderEnum, ExternalSourceEnum> = {
    [BankProviderEnum.MONOBANK]: ExternalSourceEnum.MONOBANK,
    [BankProviderEnum.PRIVATBANK]: ExternalSourceEnum.PRIVATBANK,
    [BankProviderEnum.ERSTE]: ExternalSourceEnum.ERSTE,
    [BankProviderEnum.REVOLUT]: ExternalSourceEnum.REVOLUT,
    [BankProviderEnum.WISE]: ExternalSourceEnum.WISE
};

export const mapBankProviderToExternalSource = (provider: BankProviderEnum): ExternalSourceEnum =>
    BANK_PROVIDER_EXTERNAL_SOURCE_MAP[provider];
