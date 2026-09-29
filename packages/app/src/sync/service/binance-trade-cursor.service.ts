import { SyncModeEnum, SyncWarningEnum } from '@budgie/contracts';
import { BinanceTradeCursorMapSchema } from '@budgie/sync';
import * as Effect from 'effect/Effect';
import * as Result from 'effect/Result';
import * as Schema from 'effect/Schema';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { syncRepository } from '../../@generic/drizzle/db/db';

import type { SyncEntityInterface } from '@budgie/contracts';
import type { BinanceSignedClient, BinanceTradeCursorMapInterface } from '@budgie/sync';

class BinanceTradeCursorService {
    private static readonly decodeCursorMap = Schema.decodeUnknownResult(Schema.fromJsonString(BinanceTradeCursorMapSchema));

    readonly fetchTransferBatch = Effect.fn('BinanceTradeCursorService.fetchTransferBatch')(function* (
        client: BinanceSignedClient,
        sync: SyncEntityInterface,
        externalAccountId: string,
        window: { readonly fromUnixTime: number; readonly eligibleSoldOffBaseAssets: readonly string[] }
    ) {
        return yield* client.getTransfers(
            externalAccountId,
            window.fromUnixTime,
            null,
            window.eligibleSoldOffBaseAssets,
            BinanceTradeCursorService.resolveResumeCursors(sync)
        );
    });

    readonly persistRunSideEffects = Effect.fn('BinanceTradeCursorService.persistRunSideEffects')(function* (
        sync: SyncEntityInterface,
        client: BinanceSignedClient | null
    ) {
        if (!isDefined(client)) {
            return;
        }

        const mergedCursors = BinanceTradeCursorService.merge(
            BinanceTradeCursorService.parse(sync.binanceTradeCursor),
            client.getSymbolTradeCursors()
        );
        yield* syncRepository.update(sync.id, {
            binanceTradeCursor: isNotEmptyArray(Object.keys(mergedCursors)) ? JSON.stringify(mergedCursors) : null,
            lastWarning: client.isC2cUnavailable() ? SyncWarningEnum.C2C_UNAVAILABLE : null
        });
    });

    private static resolveResumeCursors(sync: SyncEntityInterface): BinanceTradeCursorMapInterface {
        if (sync.mode === SyncModeEnum.BACKWARD || !isDefined(sync.forwardSyncedAt)) {
            return {};
        }

        return BinanceTradeCursorService.parse(sync.binanceTradeCursor);
    }

    private static parse(binanceTradeCursor: string | null): BinanceTradeCursorMapInterface {
        return isNotEmptyString(binanceTradeCursor)
            ? Result.getOrElse(BinanceTradeCursorService.decodeCursorMap(binanceTradeCursor), () => ({}))
            : {};
    }

    private static merge(stored: BinanceTradeCursorMapInterface, current: BinanceTradeCursorMapInterface): BinanceTradeCursorMapInterface {
        const merged: Record<string, number> = { ...stored };
        for (const [symbol, fromId] of Object.entries(current)) {
            const storedFromId = merged[symbol];
            merged[symbol] = isDefined(storedFromId) ? Math.max(storedFromId, fromId) : fromId;
        }

        return merged;
    }
}

export const binanceTradeCursorService = new BinanceTradeCursorService();
