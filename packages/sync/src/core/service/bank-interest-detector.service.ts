import { ExternalSourceEnum, LanguageEnum, TransactionRepository, TransactionYieldRepository, YieldKindEnum } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isEmptyArray } from '@rnw-community/shared';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

export class BankInterestDetectorService extends Context.Service<BankInterestDetectorService>()(
    '@budgie/sync/BankInterestDetectorService',
    {
        make: Effect.gen(function* () {
            const transactionRepository = yield* TransactionRepository;
            const transactionYieldRepository = yield* TransactionYieldRepository;
            const bankSources = [
                ExternalSourceEnum.MONOBANK,
                ExternalSourceEnum.PRIVATBANK,
                ExternalSourceEnum.ERSTE,
                ExternalSourceEnum.REVOLUT,
                ExternalSourceEnum.ENABLE_BANKING,
                ExternalSourceEnum.WISE
            ];
            const interestKeywords: Record<LanguageEnum, readonly string[]> = {
                [LanguageEnum.EN]: ['interest'],
                [LanguageEnum.UK]: ['відсот', 'процент'],
                [LanguageEnum.DE]: ['zinsen', 'zinsgutschrift'],
                [LanguageEnum.FR]: ['intérêt', 'interet'],
                [LanguageEnum.ES]: ['interés', 'intereses']
            };
            const keywords = Object.values(interestKeywords).flat();
            const keywordPattern = new RegExp(keywords.join('|'), 'iu');
            const likePatterns = keywords.flatMap(keyword =>
                [...new Set([keyword, `${keyword.charAt(0).toUpperCase()}${keyword.slice(1)}`, keyword.toUpperCase()])].map(
                    variant => `%${variant}%`
                )
            );

            const resolveSource = Effect.fnUntraced(function* (integrationId: number | null, syncZone: string) {
                if (!isDefined(integrationId)) {
                    return null;
                }

                const positionIds = yield* transactionYieldRepository.findYieldPositionIds(integrationId, syncZone);

                return positionIds.length === 1 ? positionIds[0] : null;
            });

            return {
                tag: Effect.fn('BankInterestDetectorService.tag')(function* (scope: ConsolidationScanScopeInterface | null) {
                    if (isDefined(scope) && isEmptyArray(scope.transactionIds)) {
                        return;
                    }

                    const candidates = (yield* transactionYieldRepository.findInterestCandidates(
                        bankSources,
                        likePatterns,
                        scope?.transactionIds ?? null
                    )).filter(candidate => keywordPattern.test(`${candidate.title} ${candidate.comment}`));

                    for (const candidate of candidates) {
                        yield* transactionRepository.updateById(candidate.id, {
                            yieldKind: YieldKindEnum.INTEREST,
                            yieldSourceAccountId: yield* resolveSource(candidate.integrationId, candidate.syncZone)
                        });
                    }

                    yield* transactionYieldRepository.fillMissingYieldCategory(candidates.map(({ id }) => id));
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(BankInterestDetectorService, BankInterestDetectorService.make).pipe(
        Layer.provide([TransactionRepository.layer, TransactionYieldRepository.layer])
    );
}
