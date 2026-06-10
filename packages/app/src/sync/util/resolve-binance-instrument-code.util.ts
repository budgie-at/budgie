import { BINANCE_ASSET_ALIAS } from '@budgie/sync';

export const resolveBinanceInstrumentCode = (asset: string): string => BINANCE_ASSET_ALIAS[asset] ?? asset;
