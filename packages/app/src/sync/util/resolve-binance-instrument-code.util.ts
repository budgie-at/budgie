import { BINANCE_ASSET_INSTRUMENT_CODE } from '@budgie/sync';

const BINANCE_ASSET_INSTRUMENT_CODE_MAP = new Map<string, string>(Object.entries(BINANCE_ASSET_INSTRUMENT_CODE));

export const resolveBinanceInstrumentCode = (asset: string): string | null => BINANCE_ASSET_INSTRUMENT_CODE_MAP.get(asset) ?? null;
