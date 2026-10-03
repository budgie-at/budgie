import { AccountTypeEnum, ExternalSourceEnum } from '@budgie/contracts';
import { BinanceWalletEnum, encodeBinanceAccountId } from '@budgie/sync';

import { seed } from '../seed/seed';

export const seedUsdtFundingAccount = (instrumentId: number) =>
    seed.account({
        externalId: encodeBinanceAccountId({ wallet: BinanceWalletEnum.FUNDING, asset: 'USDT' }),
        externalSource: ExternalSourceEnum.BINANCE,
        type: AccountTypeEnum.CRYPTO_SYNC,
        instrumentId
    });
