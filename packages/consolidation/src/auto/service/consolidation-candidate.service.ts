import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import type { ConsolidationCandidateDependenciesInterface } from '../interface/consolidation-candidate-dependencies.interface';
import type { ConsolidationCandidateGroupsInterface } from '../interface/consolidation-candidate-groups.interface';
import type {
    AtmCashWithdrawalCandidateInterface,
    AtmCashWithdrawalReviewCandidateInterface,
    ExistingTransferBridgeCandidateInterface,
    ExistingTransferIncomeDuplicateCandidateInterface,
    IbanBridgeCanonicalDuplicateCandidateInterface,
    IbanBridgeChainTransferCandidateInterface,
    IbanBridgeTransferCandidateInterface,
    RefundCandidateInterface,
    RefundReviewCandidateInterface,
    TransferPairCandidateInterface,
    TransferPairReviewCandidateInterface
} from '@budgie/contracts';

export class ConsolidationCandidateService {
    constructor(private readonly dependencies: ConsolidationCandidateDependenciesInterface) {}

    @Log(
        'enter',
        result =>
            `done manualCount=${result.manualReviewCandidates.length} atmReviewCount=${result.atmCashWithdrawalReviewCandidates.length} pairCount=${result.pairCandidates.length} ibanBridgeChainCount=${result.ibanBridgeChainTransferCandidates.length} ibanBridgeDuplicateCount=${result.ibanBridgeCanonicalDuplicateCandidates.length} existingTransferBridgeCount=${result.existingTransferBridgeCandidates.length} existingTransferIncomeDuplicateCount=${result.existingTransferIncomeDuplicateCandidates.length} ibanBridgeCount=${result.ibanBridgeTransferCandidates.length} atmCount=${result.atmCashWithdrawalCandidates.length} refundCount=${result.refundCandidates.length} refundReviewCount=${result.refundReviewCandidates.length}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    async findGroups(): Promise<ConsolidationCandidateGroupsInterface> {
        const manualReviewCandidates = await this.findManualReviewCandidates();
        const atmCashWithdrawalReviewCandidates = await this.findAtmCashWithdrawalReviewCandidates();
        const ibanBridgeChainTransferCandidates = await this.findIbanBridgeChainTransferCandidates();
        const ibanBridgeCanonicalDuplicateCandidates = await this.findIbanBridgeCanonicalDuplicateCandidates();
        const existingTransferBridgeCandidates = await this.findExistingTransferBridgeCandidates();
        const ibanBridgeTransferCandidates = this.filterIbanBridgeTransferCandidates(
            await this.findIbanBridgeTransferCandidates(),
            ibanBridgeChainTransferCandidates
        );
        const existingTransferIncomeDuplicateCandidates = this.filterExistingTransferIncomeDuplicateCandidates(
            await this.findExistingTransferIncomeDuplicateCandidates(),
            existingTransferBridgeCandidates
        );
        const pairCandidates = this.filterPairCandidates(
            await this.findPairCandidates(),
            this.buildBridgeSourceTransactionIdSet(
                ibanBridgeChainTransferCandidates,
                existingTransferBridgeCandidates,
                ibanBridgeTransferCandidates,
                existingTransferIncomeDuplicateCandidates
            )
        );
        const atmCashWithdrawalCandidates = await this.findAtmCashWithdrawalCandidates();
        const refundCandidates = await this.findRefundCandidates();
        const refundReviewCandidates = await this.findRefundReviewCandidates();

        return {
            manualReviewCandidates,
            atmCashWithdrawalReviewCandidates,
            existingTransferBridgeCandidates,
            existingTransferIncomeDuplicateCandidates,
            ibanBridgeCanonicalDuplicateCandidates,
            ibanBridgeChainTransferCandidates,
            pairCandidates,
            ibanBridgeTransferCandidates,
            atmCashWithdrawalCandidates,
            refundCandidates,
            refundReviewCandidates
        };
    }

    private async findPairCandidates(): Promise<TransferPairCandidateInterface[]> {
        return await this.dependencies.transferPairRepository.findCandidates();
    }

    private async findManualReviewCandidates(): Promise<TransferPairReviewCandidateInterface[]> {
        return await this.dependencies.transferPairRepository.findManualReviewCandidates();
    }

    private async findAtmCashWithdrawalCandidates(): Promise<AtmCashWithdrawalCandidateInterface[]> {
        return await this.dependencies.transferPairRepository.findAtmCashWithdrawalCandidates();
    }

    private async findAtmCashWithdrawalReviewCandidates(): Promise<AtmCashWithdrawalReviewCandidateInterface[]> {
        return await this.dependencies.transferPairRepository.findAtmCashWithdrawalReviewCandidates();
    }

    private async findIbanBridgeTransferCandidates(): Promise<IbanBridgeTransferCandidateInterface[]> {
        return await this.dependencies.transferPairRepository.findIbanBridgeTransferCandidates();
    }

    private async findIbanBridgeCanonicalDuplicateCandidates(): Promise<IbanBridgeCanonicalDuplicateCandidateInterface[]> {
        return await this.dependencies.transferPairRepository.findIbanBridgeCanonicalDuplicateCandidates();
    }

    private async findExistingTransferBridgeCandidates(): Promise<ExistingTransferBridgeCandidateInterface[]> {
        return await this.dependencies.transferPairRepository.findExistingTransferBridgeCandidates();
    }

    private async findExistingTransferIncomeDuplicateCandidates(): Promise<ExistingTransferIncomeDuplicateCandidateInterface[]> {
        return await this.dependencies.transferPairRepository.findExistingTransferIncomeDuplicateCandidates();
    }

    private async findIbanBridgeChainTransferCandidates(): Promise<IbanBridgeChainTransferCandidateInterface[]> {
        return await this.dependencies.transferPairRepository.findIbanBridgeChainTransferCandidates();
    }

    private async findRefundCandidates(): Promise<RefundCandidateInterface[]> {
        return await this.dependencies.refundPairRepository.findCandidates();
    }

    private async findRefundReviewCandidates(): Promise<RefundReviewCandidateInterface[]> {
        return await this.dependencies.refundPairRepository.findReviewCandidates();
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
        existingTransferBridgeCandidates: ExistingTransferBridgeCandidateInterface[]
    ): ExistingTransferIncomeDuplicateCandidateInterface[] {
        const sourceTransactionIds = this.buildExistingTransferBridgeSourceTransactionIdSet(existingTransferBridgeCandidates);

        return candidates.filter(
            candidate => !sourceTransactionIds.has(candidate.existingTransferId) && !sourceTransactionIds.has(candidate.incomeTransactionId)
        );
    }

    private filterIbanBridgeTransferCandidates(
        candidates: IbanBridgeTransferCandidateInterface[],
        bridgeChainCandidates: IbanBridgeChainTransferCandidateInterface[]
    ): IbanBridgeTransferCandidateInterface[] {
        const sourceTransactionIds = this.buildBridgeChainSourceTransactionIdSet(bridgeChainCandidates);

        return candidates.filter(
            candidate =>
                !sourceTransactionIds.has(candidate.expenseTransactionId) && !sourceTransactionIds.has(candidate.incomeTransactionId)
        );
    }

    private buildBridgeSourceTransactionIdSet(
        bridgeChainCandidates: IbanBridgeChainTransferCandidateInterface[],
        existingTransferBridgeCandidates: ExistingTransferBridgeCandidateInterface[],
        bridgeCandidates: IbanBridgeTransferCandidateInterface[],
        existingTransferIncomeDuplicateCandidates: ExistingTransferIncomeDuplicateCandidateInterface[]
    ): Set<number> {
        const sourceTransactionIds = this.buildBridgeChainSourceTransactionIdSet(bridgeChainCandidates);
        const existingTransferBridgeSourceTransactionIds = existingTransferBridgeCandidates.flatMap(candidate => [
            candidate.sourceExpenseTransactionId,
            candidate.bridgeIncomeTransactionId,
            candidate.existingTransferId
        ]);
        const bridgeSourceTransactionIds = bridgeCandidates
            .flatMap(candidate => [candidate.expenseTransactionId, candidate.incomeTransactionId, candidate.existingDirectTransferId])
            .filter(isDefined);
        const duplicateSourceTransactionIds = existingTransferIncomeDuplicateCandidates.map(candidate => candidate.incomeTransactionId);
        const additionalSourceTransactionIds = [
            ...existingTransferBridgeSourceTransactionIds,
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
