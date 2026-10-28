import { BankIntegrationRepository } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Result from 'effect/Result';
import * as Schema from 'effect/Schema';

import { isNotEmptyString } from '@rnw-community/shared';

import { BinanceHistoryProgressMapSchema } from '../constant/binance-history-progress.schema';

import type { BinanceHistoryProgressInterface, BinanceHistoryProgressMapInterface } from '../constant/binance-history-progress.schema';
import type { BinanceHistorySourceEnum } from '../enum/binance-history-source.enum';

export class BinanceHistoryProgressService extends Context.Service<BinanceHistoryProgressService>()(
    '@budgie/sync/BinanceHistoryProgressService',
    {
        make: Effect.gen(function* () {
            const bankIntegrationRepository = yield* BankIntegrationRepository;
            const decodeProgressMap = Schema.decodeUnknownResult(Schema.fromJsonString(BinanceHistoryProgressMapSchema));

            const load = Effect.fnUntraced(function* (integrationId: number) {
                const historyProgress = (yield* bankIntegrationRepository.findById(integrationId))?.historyProgress ?? null;

                return isNotEmptyString(historyProgress)
                    ? Result.getOrElse(decodeProgressMap(historyProgress), (): BinanceHistoryProgressMapInterface => ({}))
                    : {};
            });

            return {
                find: Effect.fn('BinanceHistoryProgressService.find')(function* (integrationId: number, source: BinanceHistorySourceEnum) {
                    return (yield* load(integrationId))[source] ?? null;
                }),
                save: Effect.fn('BinanceHistoryProgressService.save')(function* (
                    integrationId: number,
                    source: BinanceHistorySourceEnum,
                    progress: BinanceHistoryProgressInterface
                ) {
                    yield* bankIntegrationRepository.updateById(integrationId, {
                        historyProgress: JSON.stringify({ ...(yield* load(integrationId)), [source]: progress })
                    });
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(BinanceHistoryProgressService, BinanceHistoryProgressService.make).pipe(
        Layer.provide(BankIntegrationRepository.layer)
    );
}
