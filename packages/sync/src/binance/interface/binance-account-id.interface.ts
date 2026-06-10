import type { BinanceWalletEnum } from '../enum/binance-wallet.enum';

export interface BinanceAccountIdInterface {
    readonly wallet: BinanceWalletEnum;
    readonly asset: string;
}
