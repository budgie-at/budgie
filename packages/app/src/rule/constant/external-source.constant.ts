import { ExternalSourceEnum } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

import { BROKERAGE_FUNDING_TITLE } from '../../brokerage/constant/brokerage-funding-title.constant';

export const EXTERNAL_SOURCE: Record<ExternalSourceEnum, MessageDescriptor> = {
    [ExternalSourceEnum.MANUAL]: msg`Manual`,
    [ExternalSourceEnum.MONOBANK]: msg`Monobank`,
    [ExternalSourceEnum.PRIVATBANK]: msg`Privatbank`,
    [ExternalSourceEnum.ERSTE]: msg`Erste`,
    [ExternalSourceEnum.REVOLUT]: msg`Revolut`,
    [ExternalSourceEnum.BINANCE]: msg`Binance`,
    [ExternalSourceEnum.ENABLE_BANKING]: msg`Enable Banking`,
    [ExternalSourceEnum.COINBASE]: msg`Coinbase`,
    [ExternalSourceEnum.WISE]: msg`Wise`,
    [ExternalSourceEnum.APPLE_PAY_AUTOMATION]: msg`Apple Pay automation`,
    [ExternalSourceEnum.CSV]: msg`CSV`,
    [ExternalSourceEnum.RECEIPT]: msg`Receipt`,
    [ExternalSourceEnum.INZHUR]: msg`Inzhur`,
    [ExternalSourceEnum.BROKERAGE_FUNDING]: BROKERAGE_FUNDING_TITLE
};
