import { BINANCE_ASSET_ALIAS } from '@budgie/sync';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { accountRepository, instrumentRepository } from '../../@generic/drizzle/db/db';

import type { ExternalSourceEnum } from '@budgie/contracts';

class BinanceAssetCodeService {
    readonly resolveEligibleSoldOffBaseAssets = Effect.fn('BinanceAssetCodeService.resolveEligibleSoldOffBaseAssets')(function* (
        provider: ExternalSourceEnum
    ) {
        const assetCodes = new Set<string>();
        const accountInstrumentIds = new Set(
            (yield* accountRepository.findByExternalSource(provider)).map(account => account.instrumentId)
        );

        for (const instrument of yield* instrumentRepository.getAll()) {
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
    });

    resolveInstrumentCode(asset: string): string {
        return BINANCE_ASSET_ALIAS[asset] ?? asset;
    }
}

export const binanceAssetCodeService = new BinanceAssetCodeService();
