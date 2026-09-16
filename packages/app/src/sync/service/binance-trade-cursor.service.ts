import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { syncRepository } from '../../@generic/drizzle/db/db';
import { getSyncModule } from '../util/load-sync-module.util';

import type { SyncEntityInterface } from '@budgie/contracts';
import type { BinanceSignedClient, BinanceTradeCursorMapInterface } from '@budgie/sync';

class BinanceTradeCursorService {
    // eslint-disable-next-line lingui/no-unlocalized-strings -- Stored sync-status text, mirrors the existing unlocalized lastError field
    private static readonly C2C_UNAVAILABLE_WARNING = 'Binance P2P orders are unavailable: the API key is missing P2P read permission.';

    parse(binanceTradeCursor: string | null): BinanceTradeCursorMapInterface {
        if (!isNotEmptyString(binanceTradeCursor)) {
            return {};
        }

        try {
            const parsed = getSyncModule().BinanceTradeCursorMapSchema.safeParse(JSON.parse(binanceTradeCursor));

            return parsed.success ? parsed.data : {};
        } catch {
            return {};
        }
    }

    mergeCursors(
        stored: BinanceTradeCursorMapInterface,
        current: BinanceTradeCursorMapInterface
    ): BinanceTradeCursorMapInterface {
        const merged: BinanceTradeCursorMapInterface = { ...stored };
        for (const [symbol, fromId] of Object.entries(current)) {
            const storedFromId = merged[symbol];
            merged[symbol] = isDefined(storedFromId) ? Math.max(storedFromId, fromId) : fromId;
        }

        return merged;
    }

    async persistRunSideEffects(sync: SyncEntityInterface, client: BinanceSignedClient | null): Promise<void> {
        if (!isDefined(client)) {
            return;
        }

        const mergedCursors = this.mergeCursors(this.parse(sync.binanceTradeCursor), client.getSymbolTradeCursors());
        await syncRepository.update(sync.id, {
            binanceTradeCursor: isNotEmptyArray(Object.keys(mergedCursors)) ? JSON.stringify(mergedCursors) : null,
            lastWarning: client.isC2cUnavailable() ? BinanceTradeCursorService.C2C_UNAVAILABLE_WARNING : null
        });
    }
}

export const binanceTradeCursorService = new BinanceTradeCursorService();
