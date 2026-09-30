import { RefundPairRepository } from '@budgie/consolidation';
import * as Effect from 'effect/Effect';

export const fetchRankedRefundCandidates = Effect.fnUntraced(function* () {
    const refundPairRepository = yield* RefundPairRepository;

    return {
        auto: yield* refundPairRepository.findCandidates(),
        review: yield* refundPairRepository.findReviewCandidates()
    };
});
