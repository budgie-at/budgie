import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { isError } from '@rnw-community/shared';

import { ConsolidationEligibilityService } from './consolidation-eligibility.service';
import { ConsolidationMutationService } from './consolidation-mutation.service';

import type { ConsolidationExecutorDependenciesInterface } from '../interface/consolidation-executor-dependencies.interface';
import type {
    DB,
    ExistingTransferChainReclaimCandidateInterface,
    ExistingTransferIncomeDuplicateCandidateInterface,
    IbanBridgeCanonicalDuplicateCandidateInterface,
    RefundCandidateInterface
} from '@budgie/contracts';

export class ConsolidationRepairExecutorService {
    private readonly consolidationMutationService: ConsolidationMutationService;

    private readonly consolidationEligibilityService: ConsolidationEligibilityService;

    constructor(private readonly dependencies: ConsolidationExecutorDependenciesInterface) {
        this.consolidationMutationService = new ConsolidationMutationService(dependencies);
        this.consolidationEligibilityService = new ConsolidationEligibilityService(dependencies);
    }

    @Log.withoutErrorPayload(
        () => 'enter ibanBridgeCanonicalDuplicate',
        result => `done ibanBridgeCanonicalDuplicateOutcome=${String(result)}`,
        error => `throw ibanBridgeCanonicalDuplicateErrorClass=${isError(error) ? error.name : 'UnknownError'}`
    )
    async consolidateIbanBridgeCanonicalDuplicate(candidate: IbanBridgeCanonicalDuplicateCandidateInterface): Promise<boolean> {
        return await this.dependencies.runTransaction(this.dependencies.database, async tx =>
            this.consolidateIbanBridgeCanonicalDuplicateInner(candidate, tx)
        );
    }

    @Log.withoutErrorPayload(
        () => 'enter existingTransferChainReclaim',
        result => `done existingTransferChainReclaimOutcome=${String(result)}`,
        error => `throw existingTransferChainReclaimErrorClass=${isError(error) ? error.name : 'UnknownError'}`
    )
    async consolidateExistingTransferChainReclaim(candidate: ExistingTransferChainReclaimCandidateInterface): Promise<boolean> {
        return await this.dependencies.runTransaction(this.dependencies.database, async tx =>
            this.consolidateExistingTransferChainReclaimInner(candidate, tx)
        );
    }

    @Log.withoutErrorPayload(
        () => 'enter existingTransferIncomeDuplicate',
        result => `done existingTransferIncomeDuplicateOutcome=${String(result)}`,
        error => `throw existingTransferIncomeDuplicateErrorClass=${isError(error) ? error.name : 'UnknownError'}`
    )
    async consolidateExistingTransferIncomeDuplicate(candidate: ExistingTransferIncomeDuplicateCandidateInterface): Promise<boolean> {
        return await this.dependencies.runTransaction(this.dependencies.database, async tx =>
            this.consolidateExistingTransferIncomeDuplicateInner(candidate, tx)
        );
    }

    @Log.withoutErrorPayload(
        () => 'enter refundRepair',
        result => `done refundRepairOutcome=${String(result)}`,
        error => `throw refundRepairErrorClass=${isError(error) ? error.name : 'UnknownError'}`
    )
    async consolidateRefund(candidate: RefundCandidateInterface): Promise<boolean> {
        return await this.dependencies.runTransaction(this.dependencies.database, async tx => this.consolidateRefundInner(candidate, tx));
    }

    private async consolidateIbanBridgeCanonicalDuplicateInner(
        candidate: IbanBridgeCanonicalDuplicateCandidateInterface,
        tx: DB
    ): Promise<boolean> {
        const sourceTransactionIds = [candidate.expenseTransactionId, candidate.incomeTransactionId];

        if (!(await this.consolidationEligibilityService.areCandidatesStillEligible(sourceTransactionIds, tx))) {
            return false;
        }

        await this.consolidationMutationService.moveSourcesToCanonical(sourceTransactionIds, candidate.existingCanonicalTransferId, tx);

        return true;
    }

    private async consolidateExistingTransferChainReclaimInner(
        candidate: ExistingTransferChainReclaimCandidateInterface,
        tx: DB
    ): Promise<boolean> {
        const sourceTransactionIds = [candidate.bridgeIncomeTransactionId, candidate.bridgeExpenseTransactionId];

        if (
            !(await this.consolidationEligibilityService.isExistingTransferConsolidationStillEligible(
                sourceTransactionIds,
                candidate.existingTransferId,
                tx
            ))
        ) {
            return false;
        }

        await this.dependencies.transactionRepository.setConsolidationType(
            candidate.existingTransferId,
            TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER,
            tx
        );
        await this.consolidationMutationService.moveSourcesToCanonical(sourceTransactionIds, candidate.existingTransferId, tx);

        return true;
    }

    private async consolidateExistingTransferIncomeDuplicateInner(
        candidate: ExistingTransferIncomeDuplicateCandidateInterface,
        tx: DB
    ): Promise<boolean> {
        const sourceTransactionIds = [candidate.incomeTransactionId];

        if (
            !(await this.consolidationEligibilityService.isExistingTransferConsolidationStillEligible(
                sourceTransactionIds,
                candidate.existingTransferId,
                tx
            ))
        ) {
            return false;
        }

        await this.dependencies.transactionRepository.updateById(
            candidate.existingTransferId,
            {
                exchangeRate: candidate.exchangeRate,
                toAccountId: candidate.targetAccountId
            },
            tx
        );
        await this.dependencies.transactionEntryRepository.updateById(
            candidate.existingTransferTargetEntryId,
            {
                accountId: candidate.targetAccountId,
                amount: candidate.amount,
                exchangeRate: 1
            },
            tx
        );
        await this.dependencies.transactionRepository.setConsolidationType(
            candidate.existingTransferId,
            TransactionConsolidationTypeEnum.TRANSFER_PAIR,
            tx
        );
        await this.consolidationMutationService.moveSourcesToCanonical([candidate.incomeTransactionId], candidate.existingTransferId, tx);

        return true;
    }

    private async consolidateRefundInner(candidate: RefundCandidateInterface, tx: DB): Promise<boolean> {
        const sourceTransactionIds = [candidate.expenseTransactionId, ...candidate.refundIncomeTransactionIds];

        if (!(await this.consolidationEligibilityService.areCandidatesStillEligible(sourceTransactionIds, tx))) {
            return false;
        }

        await this.dependencies.transactionRepository.setConsolidationType(
            candidate.expenseTransactionId,
            TransactionConsolidationTypeEnum.REFUND,
            tx
        );
        await this.consolidationMutationService.copySourceTags(candidate.refundIncomeTransactionIds, candidate.expenseTransactionId, tx);
        await this.consolidationMutationService.moveSourcesToCanonical(
            candidate.refundIncomeTransactionIds,
            candidate.expenseTransactionId,
            tx
        );

        return true;
    }
}
