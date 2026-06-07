import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import type { ConsolidationCandidateDependenciesInterface } from '../interface/consolidation-candidate-dependencies.interface';
import type { ConsolidationCandidateGroupsInterface } from '../interface/consolidation-candidate-groups.interface';
import type {
    ConsolidationScanScopeInterface,
    ExistingTransferBridgeCandidateInterface,
    ExistingTransferChainReclaimCandidateInterface,
    ExistingTransferIncomeDuplicateCandidateInterface,
    IbanBridgeChainTransferCandidateInterface,
    IbanBridgeTransferCandidateInterface,
    TransferPairCandidateInterface
} from '@budgie/contracts';

export class ConsolidationCandidateService {
    constructor(private readonly dependencies: ConsolidationCandidateDependenciesInterface) {}

    @Log(
        scope =>
            `enter scopeTransactionIds=${scope?.transactionIds.join(',') ?? ''} scopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} scopeTo=${scope?.operatedAtTo.toISOString() ?? ''}`,
        (result, scope) =>
            `done scopeTransactionIds=${scope?.transactionIds.join(',') ?? ''} scopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} scopeTo=${scope?.operatedAtTo.toISOString() ?? ''} manualCount=${result.manualReviewCandidates.length} atmReviewCount=${result.atmCashWithdrawalReviewCandidates.length} pairCount=${result.pairCandidates.length} ibanBridgeChainCount=${result.ibanBridgeChainTransferCandidates.length} existingTransferBridgeCount=${result.existingTransferBridgeCandidates.length} existingTransferChainReclaimCount=${result.existingTransferChainReclaimCandidates.length} ibanBridgeDuplicateCount=${result.ibanBridgeCanonicalDuplicateCandidates.length} existingTransferIncomeDuplicateCount=${result.existingTransferIncomeDuplicateCandidates.length} ibanBridgeCount=${result.ibanBridgeTransferCandidates.length} atmCount=${result.atmCashWithdrawalCandidates.length} refundCount=${result.refundCandidates.length} refundReviewCount=${result.refundReviewCandidates.length}`,
        (error, scope) =>
            `throw scopeTransactionIds=${scope?.transactionIds.join(',') ?? ''} scopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} scopeTo=${scope?.operatedAtTo.toISOString() ?? ''} error=${getErrorMessage(error)}`
    )
    async findGroups(scope: ConsolidationScanScopeInterface | null = null): Promise<ConsolidationCandidateGroupsInterface> {
        const reviewCandidateGroups = await this.findReviewCandidateGroups(scope);
        const ibanBridgeChainTransferCandidates =
            await this.dependencies.transferPairRepository.findIbanBridgeChainTransferCandidates(scope);
        const existingTransferBridgeCandidates = await this.dependencies.transferPairRepository.findExistingTransferBridgeCandidates(scope);
        const existingTransferChainReclaimCandidates =
            await this.dependencies.transferPairRepository.findExistingTransferChainReclaimCandidates(scope);
        const ibanBridgeCanonicalDuplicateCandidates =
            await this.dependencies.transferPairRepository.findIbanBridgeCanonicalDuplicateCandidates(scope);
        const ibanBridgeTransferCandidates = this.filterIbanBridgeTransferCandidates(
            await this.dependencies.transferPairRepository.findIbanBridgeTransferCandidates(scope),
            this.buildBridgeTransferBlockedSourceTransactionIdSet(ibanBridgeChainTransferCandidates, existingTransferChainReclaimCandidates)
        );
        const existingTransferIncomeDuplicateCandidates = this.filterExistingTransferIncomeDuplicateCandidates(
            await this.dependencies.transferPairRepository.findExistingTransferIncomeDuplicateCandidates(scope),
            this.buildExistingTransferDuplicateBlockedSourceTransactionIdSet(
                existingTransferBridgeCandidates,
                existingTransferChainReclaimCandidates
            )
        );
        const pairCandidates = this.filterPairCandidates(
            await this.dependencies.transferPairRepository.findCandidates(scope),
            this.buildBridgeSourceTransactionIdSet({
                ibanBridgeChainTransferCandidates,
                existingTransferBridgeCandidates,
                existingTransferChainReclaimCandidates,
                ibanBridgeTransferCandidates,
                existingTransferIncomeDuplicateCandidates
            })
        );
        const atmCashWithdrawalCandidates = await this.dependencies.transferPairRepository.findAtmCashWithdrawalCandidates(scope);
        const refundCandidates = await this.dependencies.refundPairRepository.findCandidates(scope);

        return {
            ...reviewCandidateGroups,
            existingTransferBridgeCandidates,
            existingTransferChainReclaimCandidates,
            existingTransferIncomeDuplicateCandidates,
            ibanBridgeCanonicalDuplicateCandidates,
            ibanBridgeChainTransferCandidates,
            pairCandidates,
            ibanBridgeTransferCandidates,
            atmCashWithdrawalCandidates,
            refundCandidates
        };
    }

    @Log('enter', result => `done existingTransferIncomeDuplicateCount=${result.length}`, error => `throw error=${getErrorMessage(error)}`)
    async findExistingTransferIncomeDuplicateRepairCandidates(): Promise<ExistingTransferIncomeDuplicateCandidateInterface[]> {
        const existingTransferBridgeCandidates = await this.dependencies.transferPairRepository.findExistingTransferBridgeCandidates(null);
        const existingTransferChainReclaimCandidates =
            await this.dependencies.transferPairRepository.findExistingTransferChainReclaimCandidates(null);

        return this.filterExistingTransferIncomeDuplicateCandidates(
            await this.dependencies.transferPairRepository.findExistingTransferIncomeDuplicateCandidates(null),
            this.buildExistingTransferDuplicateBlockedSourceTransactionIdSet(
                existingTransferBridgeCandidates,
                existingTransferChainReclaimCandidates
            )
        );
    }

    @Log('enter', result => `done count=${result}`, error => `throw error=${getErrorMessage(error)}`)
    async countManualReviewCandidates(): Promise<number> {
        const manualReviewCandidates = await this.dependencies.transferPairRepository.findManualReviewCandidates();
        const atmCashWithdrawalReviewCandidates = await this.dependencies.transferPairRepository.findAtmCashWithdrawalReviewCandidates();
        const refundReviewCandidates = await this.dependencies.refundPairRepository.findReviewCandidates();

        return manualReviewCandidates.length + atmCashWithdrawalReviewCandidates.length + refundReviewCandidates.length;
    }

    private async findReviewCandidateGroups(
        scope: ConsolidationScanScopeInterface | null
    ): Promise<
        Pick<
            ConsolidationCandidateGroupsInterface,
            'manualReviewCandidates' | 'atmCashWithdrawalReviewCandidates' | 'refundReviewCandidates'
        >
    > {
        if (isDefined(scope)) {
            return {
                manualReviewCandidates: [],
                atmCashWithdrawalReviewCandidates: [],
                refundReviewCandidates: []
            };
        }

        const [manualReviewCandidates, atmCashWithdrawalReviewCandidates, refundReviewCandidates] = await Promise.all([
            this.dependencies.transferPairRepository.findManualReviewCandidates(),
            this.dependencies.transferPairRepository.findAtmCashWithdrawalReviewCandidates(),
            this.dependencies.refundPairRepository.findReviewCandidates()
        ]);

        return {
            manualReviewCandidates,
            atmCashWithdrawalReviewCandidates,
            refundReviewCandidates
        };
    }

    private filterPairCandidates(
        candidates: TransferPairCandidateInterface[],
        sourceTransactionIds: Set<number>
    ): TransferPairCandidateInterface[] {
        return candidates.filter(
            candidate =>
                !sourceTransactionIds.has(candidate.expenseTransactionId) && !sourceTransactionIds.has(candidate.incomeTransactionId)
        );
    }

    private filterExistingTransferIncomeDuplicateCandidates(
        candidates: ExistingTransferIncomeDuplicateCandidateInterface[],
        sourceTransactionIds: Set<number>
    ): ExistingTransferIncomeDuplicateCandidateInterface[] {
        return candidates.filter(
            candidate => !sourceTransactionIds.has(candidate.existingTransferId) && !sourceTransactionIds.has(candidate.incomeTransactionId)
        );
    }

    private filterIbanBridgeTransferCandidates(
        candidates: IbanBridgeTransferCandidateInterface[],
        sourceTransactionIds: Set<number>
    ): IbanBridgeTransferCandidateInterface[] {
        return candidates.filter(
            candidate =>
                !sourceTransactionIds.has(candidate.expenseTransactionId) && !sourceTransactionIds.has(candidate.incomeTransactionId)
        );
    }

    private buildBridgeSourceTransactionIdSet(
        candidateGroups: Pick<
            ConsolidationCandidateGroupsInterface,
            | 'ibanBridgeChainTransferCandidates'
            | 'existingTransferBridgeCandidates'
            | 'existingTransferChainReclaimCandidates'
            | 'ibanBridgeTransferCandidates'
            | 'existingTransferIncomeDuplicateCandidates'
        >
    ): Set<number> {
        const sourceTransactionIds = this.buildBridgeChainSourceTransactionIdSet(candidateGroups.ibanBridgeChainTransferCandidates);
        const existingTransferBridgeSourceTransactionIds = candidateGroups.existingTransferBridgeCandidates.flatMap(candidate => [
            candidate.sourceExpenseTransactionId,
            candidate.bridgeIncomeTransactionId,
            candidate.existingTransferId
        ]);
        const existingTransferChainReclaimSourceTransactionIds = candidateGroups.existingTransferChainReclaimCandidates.flatMap(
            candidate => [candidate.existingTransferId, candidate.bridgeIncomeTransactionId, candidate.bridgeExpenseTransactionId]
        );
        const bridgeSourceTransactionIds = candidateGroups.ibanBridgeTransferCandidates
            .flatMap(candidate => [candidate.expenseTransactionId, candidate.incomeTransactionId, candidate.existingDirectTransferId])
            .filter(isDefined);
        const duplicateSourceTransactionIds = candidateGroups.existingTransferIncomeDuplicateCandidates.map(
            candidate => candidate.incomeTransactionId
        );
        const additionalSourceTransactionIds = [
            ...existingTransferBridgeSourceTransactionIds,
            ...existingTransferChainReclaimSourceTransactionIds,
            ...bridgeSourceTransactionIds,
            ...duplicateSourceTransactionIds
        ];

        for (const sourceTransactionId of additionalSourceTransactionIds) {
            sourceTransactionIds.add(sourceTransactionId);
        }

        return sourceTransactionIds;
    }

    private buildExistingTransferBridgeSourceTransactionIdSet(candidates: ExistingTransferBridgeCandidateInterface[]): Set<number> {
        return new Set(
            candidates.flatMap(candidate => [
                candidate.sourceExpenseTransactionId,
                candidate.bridgeIncomeTransactionId,
                candidate.existingTransferId
            ])
        );
    }

    private buildExistingTransferChainReclaimSourceTransactionIdSet(
        candidates: ExistingTransferChainReclaimCandidateInterface[]
    ): Set<number> {
        return new Set(
            candidates.flatMap(candidate => [
                candidate.existingTransferId,
                candidate.bridgeIncomeTransactionId,
                candidate.bridgeExpenseTransactionId
            ])
        );
    }

    private buildBridgeTransferBlockedSourceTransactionIdSet(
        bridgeChainCandidates: IbanBridgeChainTransferCandidateInterface[],
        existingTransferChainReclaimCandidates: ExistingTransferChainReclaimCandidateInterface[]
    ): Set<number> {
        const sourceTransactionIds = this.buildBridgeChainSourceTransactionIdSet(bridgeChainCandidates);
        const existingTransferChainReclaimSourceTransactionIds = this.buildExistingTransferChainReclaimSourceTransactionIdSet(
            existingTransferChainReclaimCandidates
        );

        for (const sourceTransactionId of existingTransferChainReclaimSourceTransactionIds) {
            sourceTransactionIds.add(sourceTransactionId);
        }

        return sourceTransactionIds;
    }

    private buildExistingTransferDuplicateBlockedSourceTransactionIdSet(
        existingTransferBridgeCandidates: ExistingTransferBridgeCandidateInterface[],
        existingTransferChainReclaimCandidates: ExistingTransferChainReclaimCandidateInterface[]
    ): Set<number> {
        const sourceTransactionIds = this.buildExistingTransferBridgeSourceTransactionIdSet(existingTransferBridgeCandidates);
        const existingTransferChainReclaimSourceTransactionIds = this.buildExistingTransferChainReclaimSourceTransactionIdSet(
            existingTransferChainReclaimCandidates
        );

        for (const sourceTransactionId of existingTransferChainReclaimSourceTransactionIds) {
            sourceTransactionIds.add(sourceTransactionId);
        }

        return sourceTransactionIds;
    }

    private buildBridgeChainSourceTransactionIdSet(candidates: IbanBridgeChainTransferCandidateInterface[]): Set<number> {
        const sourceTransactionIds = new Set<number>();

        for (const candidate of candidates) {
            sourceTransactionIds.add(candidate.sourceExpenseTransactionId);
            sourceTransactionIds.add(candidate.bridgeIncomeTransactionId);
            sourceTransactionIds.add(candidate.bridgeExpenseTransactionId);
            sourceTransactionIds.add(candidate.targetIncomeTransactionId);
        }

        return sourceTransactionIds;
    }
}
