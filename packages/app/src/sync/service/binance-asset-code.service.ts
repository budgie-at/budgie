import { isDefined } from '@rnw-community/shared';

import { accountRepository, instrumentRepository } from '../../@generic/drizzle/db/db';
import { getSyncModule, loadSyncModule } from '../util/load-sync-module.util';

import type { ExternalSourceEnum } from '@budgie/contracts';

class BinanceAssetCodeService {
    resolveInstrumentCode(asset: string): string {
        return getSyncModule().BINANCE_ASSET_ALIAS[asset] ?? asset;
    }

    async resolveEligibleSoldOffBaseAssets(provider: ExternalSourceEnum): Promise<string[]> {
        const { BINANCE_ASSET_ALIAS } = await loadSyncModule();
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
