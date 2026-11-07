import { ExternalSourceEnum } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

export const BANK_PROVIDER_TITLE: Partial<Record<ExternalSourceEnum, MessageDescriptor>> = {
    [ExternalSourceEnum.BINANCE]: msg`Binance`,
    [ExternalSourceEnum.ENABLE_BANKING]: msg`Enable Banking`,
    [ExternalSourceEnum.COINBASE]: msg`Coinbase`,
    [ExternalSourceEnum.ERSTE]: msg`Erste`,
    [ExternalSourceEnum.INZHUR]: msg`Inzhur`,
    [ExternalSourceEnum.MONOBANK]: msg`Monobank`,
    [ExternalSourceEnum.PRIVATBANK]: msg`PrivatBank`,
    [ExternalSourceEnum.REVOLUT]: msg`Revolut`,
    [ExternalSourceEnum.WISE]: msg`Wise`
};
