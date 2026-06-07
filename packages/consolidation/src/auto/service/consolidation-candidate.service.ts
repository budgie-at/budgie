import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { yieldToEventLoop } from '../utils/yield-to-event-loop.util';

import { ConsolidationSourceTransactionSetService } from './consolidation-source-transaction-set.service';

import type { ConsolidationCandidateDependenciesInterface } from '../interface/consolidation-candidate-dependencies.interface';
import type { ConsolidationCandidateGroupsInterface } from '../interface/consolidation-candidate-groups.interface';
import type {
    ConsolidationScanScopeInterface,
    ExistingTransferIncomeDuplicateCandidateInterface,
    IbanBridgeTransferCandidateInterface,
    TransferPairCandidateInterface
} from '@budgie/contracts';

export class ConsolidationCandidateService {
    private readonly sourceTransactionSetService = new ConsolidationSourceTransactionSetService();

    constructor(
        private readonly dependencies: ConsolidationCandidateDependenciesInterface,
        private readonly yieldControl: () => Promise<void> = yieldToEventLoop
    ) {}

    @Log(
        scope =>
            `enter candidateScanFrom=${scope?.operatedAtFrom.toISOString() ?? ''} candidateScanTo=${scope?.operatedAtTo.toISOString() ?? ''} candidateScanIds=${scope?.transactionIds.join(',') ?? ''}`,
        (result, scope) =>
            `done candidateScanFrom=${scope?.operatedAtFrom.toISOString() ?? ''} candidateScanTo=${scope?.operatedAtTo.toISOString() ?? ''} candidateScanIds=${scope?.transactionIds.join(',') ?? ''} manualCount=${result.manualReviewCandidates.length} atmReviewCount=${result.atmCashWithdrawalReviewCandidates.length} pairCount=${result.pairCandidates.length} ibanBridgeChainCount=${result.ibanBridgeChainTransferCandidates.length} existingTransferBridgeCount=${result.existingTransferBridgeCandidates.length} existingTransferChainReclaimCount=${result.existingTransferChainReclaimCandidates.length} ibanBridgeDuplicateCount=${result.ibanBridgeCanonicalDuplicateCandidates.length} existingTransferIncomeDuplicateCount=${result.existingTransferIncomeDuplicateCandidates.length} ibanBridgeCount=${result.ibanBridgeTransferCandidates.length} atmCount=${result.atmCashWithdrawalCandidates.length} refundCount=${result.refundCandidates.length} refundReviewCount=${result.refundReviewCandidates.length}`,
        (error, scope) =>
            `throw candidateScanFrom=${scope?.operatedAtFrom.toISOString() ?? ''} candidateScanTo=${scope?.operatedAtTo.toISOString() ?? ''} candidateScanIds=${scope?.transactionIds.join(',') ?? ''} error=${getErrorMessage(error)}`
    )
    async findGroups(scope: ConsolidationScanScopeInterface | null = null): Promise<ConsolidationCandidateGroupsInterface> {
        const reviewCandidateGroups = await this.findReviewCandidateGroups(scope);
        const priorityTransferCandidateGroups = await this.findPriorityTransferCandidateGroups(scope);
        const bridgeCandidateGroups = await this.findFilteredBridgeCandidateGroups(scope, priorityTransferCandidateGroups);
        const pairCandidates = await this.findFilteredPairCandidates(scope, {
            ...priorityTransferCandidateGroups,
            ...bridgeCandidateGroups
        });
        const atmCashWithdrawalCandidates = await this.findAtmCashWithdrawalCandidates(scope);
        const refundCandidates = await this.findRefundCandidates(scope);

        return {
            ...reviewCandidateGroups,
            ...priorityTransferCandidateGroups,
            ...bridgeCandidateGroups,
            pairCandidates,
            atmCashWithdrawalCandidates,
            refundCandidates
        };
    }

    @Log('enter', result => `done existingTransferIncomeDuplicateCount=${result.length}`, error => `throw error=${getErrorMessage(error)}`)
    async findExistingTransferIncomeDuplicateRepairCandidates(): Promise<ExistingTransferIncomeDuplicateCandidateInterface[]> {
        const existingTransferBridgeCandidates = await this.dependencies.transferPairRepository.findExistingTransferBridgeCandidates(null);
        await this.yieldControl();
        const existingTransferChainReclaimCandidates =
            await this.dependencies.transferPairRepository.findExistingTransferChainReclaimCandidates(null);
        await this.yieldControl();
        const rawExistingTransferIncomeDuplicateCandidates =
            await this.dependencies.transferPairRepository.findExistingTransferIncomeDuplicateCandidates(null);
        await this.yieldControl();

        const existingTransferIncomeDuplicateCandidates = this.filterExistingTransferIncomeDuplicateCandidates(
            rawExistingTransferIncomeDuplicateCandidates,
            this.sourceTransactionSetService.buildExistingTransferDuplicateBlockedSourceTransactionIdSet(
                existingTransferBridgeCandidates,
                existingTransferChainReclaimCandidates
            )
        );
        await this.yieldControl();

        return existingTransferIncomeDuplicateCandidates;
    }

    @Log('enter', result => `done count=${result}`, error => `throw error=${getErrorMessage(error)}`)
    async countManualReviewCandidates(): Promise<number> {
        const [manualReviewCandidates, atmCashWithdrawalReviewCandidates, refundReviewCandidates] = await Promise.all([
            this.dependencies.transferPairRepository.findManualReviewCandidates(),
            this.dependencies.transferPairRepository.findAtmCashWithdrawalReviewCandidates(),
            this.dependencies.refundPairRepository.findReviewCandidates()
        ]);
        await this.yieldControl();

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

    private async findPriorityTransferCandidateGroups(
        scope: ConsolidationScanScopeInterface | null
    ): Promise<
        Pick<
            ConsolidationCandidateGroupsInterface,
            | 'ibanBridgeChainTransferCandidates'
            | 'existingTransferBridgeCandidates'
            | 'existingTransferChainReclaimCandidates'
            | 'ibanBridgeCanonicalDuplicateCandidates'
        >
    > {
        const ibanBridgeChainTransferCandidates =
            await this.dependencies.transferPairRepository.findIbanBridgeChainTransferCandidates(scope);
        await this.yieldControl();
        const existingTransferBridgeCandidates = await this.dependencies.transferPairRepository.findExistingTransferBridgeCandidates(scope);
        await this.yieldControl();
        const existingTransferChainReclaimCandidates =
            await this.dependencies.transferPairRepository.findExistingTransferChainReclaimCandidates(scope);
        await this.yieldControl();
        const ibanBridgeCanonicalDuplicateCandidates =
            await this.dependencies.transferPairRepository.findIbanBridgeCanonicalDuplicateCandidates(scope);
        await this.yieldControl();

        return {
            ibanBridgeChainTransferCandidates,
            existingTransferBridgeCandidates,
            existingTransferChainReclaimCandidates,
            ibanBridgeCanonicalDuplicateCandidates
        };
    }

    private async findFilteredBridgeCandidateGroups(
        scope: ConsolidationScanScopeInterface | null,
        priorityTransferCandidateGroups: Pick<
            ConsolidationCandidateGroupsInterface,
            'ibanBridgeChainTransferCandidates' | 'existingTransferBridgeCandidates' | 'existingTransferChainReclaimCandidates'
        >
    ): Promise<Pick<ConsolidationCandidateGroupsInterface, 'ibanBridgeTransferCandidates' | 'existingTransferIncomeDuplicateCandidates'>> {
        const rawIbanBridgeTransferCandidates = await this.dependencies.transferPairRepository.findIbanBridgeTransferCandidates(scope);
        await this.yieldControl();
        const ibanBridgeTransferCandidates = this.filterIbanBridgeTransferCandidates(
            rawIbanBridgeTransferCandidates,
            this.sourceTransactionSetService.buildBridgeTransferBlockedSourceTransactionIdSet(
                priorityTransferCandidateGroups.ibanBridgeChainTransferCandidates,
                priorityTransferCandidateGroups.existingTransferChainReclaimCandidates
            )
        );
        await this.yieldControl();
        const rawExistingTransferIncomeDuplicateCandidates =
            await this.dependencies.transferPairRepository.findExistingTransferIncomeDuplicateCandidates(scope);
        await this.yieldControl();
        const existingTransferIncomeDuplicateCandidates = this.filterExistingTransferIncomeDuplicateCandidates(
            rawExistingTransferIncomeDuplicateCandidates,
            this.sourceTransactionSetService.buildExistingTransferDuplicateBlockedSourceTransactionIdSet(
                priorityTransferCandidateGroups.existingTransferBridgeCandidates,
                priorityTransferCandidateGroups.existingTransferChainReclaimCandidates
            )
        );
        await this.yieldControl();

        return {
            ibanBridgeTransferCandidates,
            existingTransferIncomeDuplicateCandidates
        };
    }

    private async findFilteredPairCandidates(
        scope: ConsolidationScanScopeInterface | null,
        candidateGroups: Pick<
            ConsolidationCandidateGroupsInterface,
            | 'ibanBridgeChainTransferCandidates'
            | 'existingTransferBridgeCandidates'
            | 'existingTransferChainReclaimCandidates'
            | 'ibanBridgeTransferCandidates'
            | 'existingTransferIncomeDuplicateCandidates'
        >
    ): Promise<TransferPairCandidateInterface[]> {
        const rawPairCandidates = await this.dependencies.transferPairRepository.findCandidates(scope);
        await this.yieldControl();
        const pairCandidates = this.filterPairCandidates(
            rawPairCandidates,
            this.sourceTransactionSetService.buildBridgeSourceTransactionIdSet(candidateGroups)
        );
        await this.yieldControl();

        return pairCandidates;
    }

    private async findAtmCashWithdrawalCandidates(
        scope: ConsolidationScanScopeInterface | null
    ): Promise<ConsolidationCandidateGroupsInterface['atmCashWithdrawalCandidates']> {
        const atmCashWithdrawalCandidates = await this.dependencies.transferPairRepository.findAtmCashWithdrawalCandidates(scope);
        await this.yieldControl();

        return atmCashWithdrawalCandidates;
    }

    private async findRefundCandidates(
        scope: ConsolidationScanScopeInterface | null
    ): Promise<ConsolidationCandidateGroupsInterface['refundCandidates']> {
        const refundCandidates = await this.dependencies.refundPairRepository.findCandidates(scope);
        await this.yieldControl();

        return refundCandidates;
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
}
