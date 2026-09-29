import * as Effect from 'effect/Effect';

import type { ConsolidationAutoCandidateService } from './consolidation-auto-candidate.service';
import type { ConsolidationCandidateService } from './consolidation-candidate.service';
import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

export class ConsolidationCoordinatorService {
    readonly consolidate = Effect.fn('ConsolidationCoordinatorService.consolidate')(function* (
        this: ConsolidationCoordinatorService,
        scope: ConsolidationScanScopeInterface | null = null,
        onProgress?: (processedCandidateGroupCount: number) => void
    ) {
        return yield* this.consolidationAutoCandidateService.process(scope, onProgress);
    });

    readonly countAutoCandidates = Effect.fn('ConsolidationCoordinatorService.countAutoCandidates')(function* (
        this: ConsolidationCoordinatorService,
        scope: ConsolidationScanScopeInterface | null = null
    ) {
        return yield* this.consolidationAutoCandidateService.count(scope);
    });

    readonly countManualReviewCandidates = Effect.fn('ConsolidationCoordinatorService.countManualReviewCandidates')(
        function* (this: ConsolidationCoordinatorService) {
            return yield* this.consolidationCandidateService.countManualReviewCandidates();
        }
    );

    readonly countExistingTransferIncomeDuplicateRepairCandidates = Effect.fn(
        'ConsolidationCoordinatorService.countExistingTransferIncomeDuplicateRepairCandidates'
    )(function* (this: ConsolidationCoordinatorService) {
        return (yield* this.consolidationCandidateService.findExistingTransferIncomeDuplicateRepairCandidates()).length;
    });

    readonly repairExistingTransferIncomeDuplicates = Effect.fn('ConsolidationCoordinatorService.repairExistingTransferIncomeDuplicates')(
        function* (this: ConsolidationCoordinatorService) {
            const candidates = yield* this.consolidationCandidateService.findExistingTransferIncomeDuplicateRepairCandidates();

            return yield* this.consolidationAutoCandidateService.processExistingTransferIncomeDuplicateCandidates(candidates);
        }
    );

    readonly countBridgeClaimRepairCandidates = Effect.fn('ConsolidationCoordinatorService.countBridgeClaimRepairCandidates')(
        function* (this: ConsolidationCoordinatorService) {
            return (yield* this.consolidationCandidateService.findBridgeClaimedRepairCandidates()).length;
        }
    );

    readonly repairBridgeClaimedTransferPairs = Effect.fn('ConsolidationCoordinatorService.repairBridgeClaimedTransferPairs')(
        function* (this: ConsolidationCoordinatorService) {
            const candidates = yield* this.consolidationCandidateService.findBridgeClaimedRepairCandidates();
            const repairedCount = yield* this.consolidationAutoCandidateService.processBridgeClaimRepairCandidates(candidates);

            if (repairedCount > 0) {
                yield* this.consolidationAutoCandidateService.process(null);
            }

            return repairedCount;
        }
    );

    constructor(
        private readonly consolidationCandidateService: ConsolidationCandidateService,
        private readonly consolidationAutoCandidateService: ConsolidationAutoCandidateService
    ) {}
}
