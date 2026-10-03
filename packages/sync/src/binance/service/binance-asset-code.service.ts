import { AccountRepository, InstrumentRepository } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import { BINANCE_ASSET_ALIAS } from '../constant/binance-asset-alias.constant';

import type { ExternalSourceEnum } from '@budgie/contracts';

export class BinanceAssetCodeService extends Context.Service<BinanceAssetCodeService>()('@budgie/sync/BinanceAssetCodeService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const instrumentRepository = yield* InstrumentRepository;

        return {
            resolveEligibleSoldOffBaseAssets: Effect.fn('BinanceAssetCodeService.resolveEligibleSoldOffBaseAssets')(function* (
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
            }),
            resolveInstrumentCode: (asset: string): string => BINANCE_ASSET_ALIAS[asset] ?? asset
        };
    })
}) {
    static readonly layer = Layer.effect(BinanceAssetCodeService, BinanceAssetCodeService.make).pipe(
        Layer.provide([AccountRepository.layer, InstrumentRepository.layer])
    );
}
