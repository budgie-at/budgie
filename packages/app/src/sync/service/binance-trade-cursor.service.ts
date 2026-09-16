import { SyncModeEnum, SyncWarningEnum } from '@budgie/contracts';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { syncRepository } from '../../@generic/drizzle/db/db';
import { getSyncModule } from '../util/load-sync-module.util';

import type { SyncEntityInterface } from '@budgie/contracts';
import type { BinanceSignedClient, BinanceTradeCursorMapInterface, BinanceTransferInterface } from '@budgie/sync';

class BinanceTradeCursorService {
    async fetchTransferBatch(
        client: BinanceSignedClient,
        sync: SyncEntityInterface,
        externalAccountId: string,
        window: { readonly fromUnixTime: number; readonly eligibleSoldOffBaseAssets: readonly string[] }
    ): Promise<BinanceTransferInterface[]> {
        const result = await client.getTransfers(
            externalAccountId,
            window.fromUnixTime,
            null,
            window.eligibleSoldOffBaseAssets,
            this.resolveResumeCursors(sync)
        );
        if (result.success) {
            return result.data;
        }

        throw getSyncModule().SyncError.from(result.error);
    }

    async withPersistedSideEffects<T>(
        sync: SyncEntityInterface,
        resolveClient: () => BinanceSignedClient | null,
        operation: () => Promise<T>
    ): Promise<T> {
        try {
            return await operation();
        } finally {
            await this.persistRunSideEffects(sync, resolveClient());
        }
    }

    private async persistRunSideEffects(sync: SyncEntityInterface, client: BinanceSignedClient | null): Promise<void> {
        if (!isDefined(client)) {
            return;
        }

        const mergedCursors = this.merge(this.parse(sync.binanceTradeCursor), client.getSymbolTradeCursors());
        await syncRepository.update(sync.id, {
            binanceTradeCursor: isNotEmptyArray(Object.keys(mergedCursors)) ? JSON.stringify(mergedCursors) : null,
            lastWarning: client.isC2cUnavailable() ? SyncWarningEnum.C2C_UNAVAILABLE : null
        });
    }

    private resolveResumeCursors(sync: SyncEntityInterface): BinanceTradeCursorMapInterface {
        if (sync.mode === SyncModeEnum.BACKWARD || !isDefined(sync.forwardSyncedAt)) {
            return {};
        }

        return this.parse(sync.binanceTradeCursor);
    }

    private parse(binanceTradeCursor: string | null): BinanceTradeCursorMapInterface {
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

    private merge(stored: BinanceTradeCursorMapInterface, current: BinanceTradeCursorMapInterface): BinanceTradeCursorMapInterface {
        const merged: BinanceTradeCursorMapInterface = { ...stored };
        for (const [symbol, fromId] of Object.entries(current)) {
            const storedFromId = merged[symbol];
            merged[symbol] = isDefined(storedFromId) ? Math.max(storedFromId, fromId) : fromId;
        }

        return merged;
    }
}

export const binanceTradeCursorService = new BinanceTradeCursorService();
