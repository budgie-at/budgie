import type { BinanceTransferSourceEnum } from '../enum/binance-transfer-source.enum';

export interface BinanceTransferInterface {
    readonly externalId: string;
    readonly fromAssetAccountId: string;
    readonly toAssetAccountId: string;
    readonly fromAmount: number;
    readonly toAmount: number;
    readonly feeAssetAccountId: string | null;
    readonly feeAmount: number;
    readonly time: number;
    readonly description: string;
    readonly source: BinanceTransferSourceEnum;
}
