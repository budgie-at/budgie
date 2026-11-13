import {
    SettingsRepository,
    SyncApplyStateRepository,
    TransactionYieldRepository,
    YIELD_TO_UI,
    normalizeYieldFields
} from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { BINANCE_YIELD_KIND_BY_PREFIX } from '../../binance/constant/binance-yield-kind-by-prefix.constant';
import { INZHUR_UNATTRIBUTED_DIVIDEND_TITLE } from '../../inzhur/constant/inzhur-unattributed-dividend-title.constant';
import { buildInzhurYieldFields } from '../../inzhur/utils/build-inzhur-yield-fields.util';

import type { YieldFieldsInterface, YieldTagCandidateInterface } from '@budgie/contracts';

export class YieldTagRepairService extends Context.Service<YieldTagRepairService>()('@budgie/sync/YieldTagRepairService', {
    make: Effect.gen(function* () {
        const transactionYieldRepository = yield* TransactionYieldRepository;
        const settingsRepository = yield* SettingsRepository;
        const syncApplyStateRepository = yield* SyncApplyStateRepository;
        const yieldTagRepairVersion = 1;
        const batchSize = 200;
        const candidateQuery = {
            externalIdPrefixes: Object.keys(BINANCE_YIELD_KIND_BY_PREFIX),
            titles: [INZHUR_UNATTRIBUTED_DIVIDEND_TITLE]
        };

        const buildBinancePatch = (candidate: YieldTagCandidateInterface): YieldFieldsInterface | null => {
            const match = Object.entries(BINANCE_YIELD_KIND_BY_PREFIX).find(
                ([prefix]) => candidate.externalId?.startsWith(prefix) === true
            );

            return isDefined(match) ? { yieldKind: match[1], yieldSourceAccountId: null } : null;
        };

        const buildInzhurPatch = (candidate: YieldTagCandidateInterface): YieldFieldsInterface | null => {
            const fields = buildInzhurYieldFields(candidate);

            return isDefined(fields)
                ? { ...fields, yieldSourceAccountId: candidate.isFundInZone ? fields.yieldSourceAccountId : null }
                : null;
        };

        const repairBatch = Effect.fnUntraced(function* (candidates: readonly YieldTagCandidateInterface[]) {
            const binanceIds: number[] = [];

            for (const candidate of candidates) {
                const binancePatch = buildBinancePatch(candidate);
                const rawPatch = buildInzhurPatch(candidate) ?? binancePatch;
                const patch = isDefined(rawPatch)
                    ? normalizeYieldFields(candidate.type, rawPatch.yieldKind, rawPatch.yieldSourceAccountId)
                    : null;

                if (isDefined(patch) && isDefined(patch.yieldKind)) {
                    yield* transactionYieldRepository.fillYieldTags(candidate.id, patch);

                    if (isDefined(binancePatch)) {
                        binanceIds.push(candidate.id);
                    }
                }
            }

            yield* transactionYieldRepository.fillMissingYieldCategory(binanceIds);
        });

        const repairCandidates = (candidates: readonly YieldTagCandidateInterface[]) =>
            isEmptyArray(candidates) ? Effect.void : syncApplyStateRepository.withoutTriggers(repairBatch(candidates));

        const repairAll = Effect.fnUntraced(function* () {
            let candidates = yield* transactionYieldRepository.findUntaggedCandidatesAfter(candidateQuery, 0, batchSize);

            while (isNotEmptyArray(candidates)) {
                yield* repairCandidates(candidates);
                yield* YIELD_TO_UI;
                candidates = yield* transactionYieldRepository.findUntaggedCandidatesAfter(
                    candidateQuery,
                    candidates[candidates.length - 1].id,
                    batchSize
                );
            }
        });

        return {
            runOnce: Effect.fn('YieldTagRepairService.runOnce')(function* () {
                const settings = yield* settingsRepository.getSettings();

                if (settings.yieldTagRepairVersion >= yieldTagRepairVersion) {
                    return;
                }

                yield* repairAll();
                yield* settingsRepository.update({ yieldTagRepairVersion });
            }),
            repairBySyncIds: Effect.fn('YieldTagRepairService.repairBySyncIds')(function* (syncIds: readonly string[]) {
                const candidates = yield* transactionYieldRepository.findUntaggedCandidatesBySyncIds(candidateQuery, syncIds);

                yield* repairCandidates(candidates);
            })
        };
    })
}) {
    static readonly layer = Layer.effect(YieldTagRepairService, YieldTagRepairService.make).pipe(
        Layer.provide([TransactionYieldRepository.layer, SettingsRepository.layer, SyncApplyStateRepository.layer])
    );
}
