import { ConsolidationCandidateRepository } from '@budgie/consolidation';
import * as Effect from 'effect/Effect';

export const snapshotMissingTransferFeeDeltas = Effect.fnUntraced(function* () {
    const candidates = yield* Effect.flatMap(ConsolidationCandidateRepository, repository =>
        repository.findMissingTransferFeeEntries()
    ).pipe(Effect.provide(ConsolidationCandidateRepository.layer));

    return candidates.reduce(
        (deltas, { accountId, amount }) => deltas.set(accountId, (deltas.get(accountId) ?? 0) - amount),
        new Map<number, number>()
    );
});
