import * as Effect from 'effect/Effect';

import type { ConsolidationResultInterface } from '../interface/consolidation-result.interface';
import type { ConsolidationFamilyRegistryService } from './consolidation-family-registry.service';
import type {
    BridgeClaimRepairCandidateInterface,
    ConsolidationScanScopeInterface,
    ExistingTransferIncomeDuplicateCandidateInterface
} from '@budgie/contracts';

export class ConsolidationAutoCandidateService {
    readonly process = Effect.fn('ConsolidationAutoCandidateService.process')(function* (
        this: ConsolidationAutoCandidateService,
        scope: ConsolidationScanScopeInterface | null = null,
        onProgress?: (processedCandidateGroupCount: number) => void
    ) {
        const blockedSourceTransactionIds = new Set<number>();
        let consolidated = 0;
        let found = 0;

        for (const family of this.consolidationFamilyRegistryService.buildFamilies()) {
            const processedCandidateGroupCount = found;
            const familyResult = yield* family.process({
                blockedSourceTransactionIds: new Set(blockedSourceTransactionIds),
                onProgress: processedCount => onProgress?.(processedCandidateGroupCount + processedCount),
                scope
            });

            for (const sourceTransactionId of familyResult.blockedSourceTransactionIds) {
                blockedSourceTransactionIds.add(sourceTransactionId);
            }

            consolidated += familyResult.consolidated;
            found += familyResult.found;
        }

        return { found, consolidated } satisfies ConsolidationResultInterface;
    });

    readonly count = Effect.fn('ConsolidationAutoCandidateService.count')(function* (
        this: ConsolidationAutoCandidateService,
        scope: ConsolidationScanScopeInterface | null = null
    ) {
        const blockedSourceTransactionIds = new Set<number>();
        let found = 0;

        for (const family of this.consolidationFamilyRegistryService.buildFamilies()) {
            const preview = yield* family.preview({ blockedSourceTransactionIds: new Set(blockedSourceTransactionIds), scope });

            for (const sourceTransactionId of preview.blockedSourceTransactionIds) {
                blockedSourceTransactionIds.add(sourceTransactionId);
            }

            found += preview.found;
        }

        return found;
    });

    readonly processExistingTransferIncomeDuplicateCandidates = Effect.fn(
        'ConsolidationAutoCandidateService.processExistingTransferIncomeDuplicateCandidates'
    )(function* (this: ConsolidationAutoCandidateService, candidates: ExistingTransferIncomeDuplicateCandidateInterface[]) {
        return yield* this.consolidationFamilyRegistryService.buildExistingTransferIncomeDuplicateFamily().processCandidateList(candidates);
    });

    readonly processBridgeClaimRepairCandidates = Effect.fn('ConsolidationAutoCandidateService.processBridgeClaimRepairCandidates')(
        function* (this: ConsolidationAutoCandidateService, candidates: BridgeClaimRepairCandidateInterface[]) {
            return yield* this.consolidationFamilyRegistryService.buildBridgeClaimRepairFamily().processCandidateList(candidates);
        }
    );

    constructor(private readonly consolidationFamilyRegistryService: ConsolidationFamilyRegistryService) {}
}
