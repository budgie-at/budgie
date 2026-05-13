import { ExternalSourceEnum } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

export const EXTERNAL_SOURCE: Record<ExternalSourceEnum, MessageDescriptor> = {
    [ExternalSourceEnum.MANUAL]: msg`Manual`,
    [ExternalSourceEnum.MONOBANK]: msg`Monobank`,
    [ExternalSourceEnum.PRIVATBANK]: msg`Privatbank`,
    [ExternalSourceEnum.ERSTE]: msg`Erste`,
    [ExternalSourceEnum.REVOLUT]: msg`Revolut`,
    [ExternalSourceEnum.BINANCE]: msg`Binance`,
    [ExternalSourceEnum.COINBASE]: msg`Coinbase`,
    [ExternalSourceEnum.WISE]: msg`Wise`,
    [ExternalSourceEnum.CSV]: msg`CSV`
};
