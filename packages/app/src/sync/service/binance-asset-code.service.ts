import { BINANCE_ASSET_ALIAS } from '@budgie/sync';

import { isDefined } from '@rnw-community/shared';

import { accountRepository, instrumentRepository } from '../../@generic/drizzle/db/db';

import type { ExternalSourceEnum } from '@budgie/contracts';

class BinanceAssetCodeService {
    resolveInstrumentCode(asset: string): string {
        return BINANCE_ASSET_ALIAS[asset] ?? asset;
    }

    async resolveEligibleSoldOffBaseAssets(provider: ExternalSourceEnum): Promise<string[]> {
        const assetCodes = new Set<string>();
        const accountInstrumentIds = new Set((await accountRepository.findByExternalSource(provider)).map(account => account.instrumentId));

        for (const instrument of await instrumentRepository.getAll()) {
            if (!isDefined(instrument.providerInstrumentId) || accountInstrumentIds.has(instrument.id)) {
                assetCodes.add(instrument.code);
            }
        }

        return [
            ...assetCodes,
            ...Object.entries(BINANCE_ASSET_ALIAS)
                .filter(([, instrumentCode]) => assetCodes.has(instrumentCode))
                .map(([binanceAssetCode]) => binanceAssetCode)
        ];
    }
}

export const binanceAssetCodeService = new BinanceAssetCodeService();
