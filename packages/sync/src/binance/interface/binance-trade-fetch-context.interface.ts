import type { BinanceTradeCursorMapInterface } from '../constant/binance-trade-cursor-map.schema';

export interface BinanceTradeFetchContextInterface {
    readonly eligibleSoldOffBaseAssets: readonly string[];
    readonly initialSymbolTradeCursors: BinanceTradeCursorMapInterface;
}
