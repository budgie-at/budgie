import { SyncModeEnum, SyncRepository, SyncWarningEnum } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Result from 'effect/Result';
import * as Schema from 'effect/Schema';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { BinanceTradeCursorMapSchema } from '../constant/binance-trade-cursor-map.schema';

import type { BinanceSignedClient } from '../client/binance-signed.client';
import type { BinanceTradeCursorMapInterface } from '../constant/binance-trade-cursor-map.schema';
import type { SyncEntityInterface } from '@budgie/contracts';

export class BinanceTradeCursorService extends Context.Service<BinanceTradeCursorService>()('@budgie/sync/BinanceTradeCursorService', {
    make: Effect.gen(function* () {
        const syncRepository = yield* SyncRepository;
        const decodeCursorMap = Schema.decodeUnknownResult(Schema.fromJsonString(BinanceTradeCursorMapSchema));

        const parse = (binanceTradeCursor: string | null): BinanceTradeCursorMapInterface =>
            isNotEmptyString(binanceTradeCursor) ? Result.getOrElse(decodeCursorMap(binanceTradeCursor), () => ({})) : {};

        const resolveResumeCursors = (sync: SyncEntityInterface): BinanceTradeCursorMapInterface => {
            if (sync.mode === SyncModeEnum.BACKWARD || !isDefined(sync.forwardSyncedAt)) {
                return {};
            }

            return parse(sync.binanceTradeCursor);
        };

        const merge = (stored: BinanceTradeCursorMapInterface, current: BinanceTradeCursorMapInterface): BinanceTradeCursorMapInterface => {
            const merged: Record<string, number> = { ...stored };
            for (const [symbol, fromId] of Object.entries(current)) {
                const storedFromId = merged[symbol];
                merged[symbol] = isDefined(storedFromId) ? Math.max(storedFromId, fromId) : fromId;
            }

            return merged;
        };

        return {
            fetchTransferBatch: Effect.fn('BinanceTradeCursorService.fetchTransferBatch')(function* (
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
                    resolveResumeCursors(sync)
                );
            }),
            persistRunSideEffects: Effect.fn('BinanceTradeCursorService.persistRunSideEffects')(function* (
                sync: SyncEntityInterface,
                client: BinanceSignedClient | null
            ) {
                if (!isDefined(client)) {
                    return;
                }

                const mergedCursors = merge(parse(sync.binanceTradeCursor), client.getSymbolTradeCursors());
                yield* syncRepository.update(sync.id, {
                    binanceTradeCursor: isNotEmptyArray(Object.keys(mergedCursors)) ? JSON.stringify(mergedCursors) : null,
                    lastWarning: client.isC2cUnavailable() ? SyncWarningEnum.C2C_UNAVAILABLE : null
                });
            })
        };
    })
}) {
    static readonly layer = Layer.effect(BinanceTradeCursorService, BinanceTradeCursorService.make).pipe(
        Layer.provide(SyncRepository.layer)
    );
}
