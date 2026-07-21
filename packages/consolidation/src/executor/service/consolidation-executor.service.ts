import { Log } from '@budgie/logger';

import { isDefined, isError } from '@rnw-community/shared';

import { ConsolidationEligibilityService } from './consolidation-eligibility.service';
import { ConsolidationMutationService } from './consolidation-mutation.service';

import type { CanonicalTransferInputInterface } from '../interface/canonical-transfer-input.interface';
import type { ConsolidationExecutorDependenciesInterface } from '../interface/consolidation-executor-dependencies.interface';
import type { ConsolidationPlanInterface } from '../interface/consolidation-plan.interface';
import type {
    AtmCashWithdrawalCandidateInterface,
    DB,
    ExistingTransferBridgeCandidateInterface,
    IbanBridgeChainTransferCandidateInterface,
    IbanBridgeTransferCandidateInterface,
    TransferPairCandidateInterface
} from '@budgie/contracts';

export class ConsolidationExecutorService {
    private readonly consolidationEligibilityService: ConsolidationEligibilityService;

    private readonly consolidationMutationService: ConsolidationMutationService;

    constructor(private readonly dependencies: ConsolidationExecutorDependenciesInterface) {
        this.consolidationEligibilityService = new ConsolidationEligibilityService(dependencies);
        this.consolidationMutationService = new ConsolidationMutationService(dependencies);
    }

    @Log.withoutErrorPayload(
        () => 'enter pair',
        result => `done pairOutcome=${String(result)}`,
        error => `throw pairErrorClass=${isError(error) ? error.name : 'UnknownError'}`
    )
    async consolidatePair(candidate: TransferPairCandidateInterface, consolidationPlan: ConsolidationPlanInterface): Promise<boolean> {
        return await this.consolidateTwoRequiredSources(candidate.expenseTransactionId, candidate.incomeTransactionId, consolidationPlan);
    }

    @Log.withoutErrorPayload(
        () => 'enter atmWithdrawal',
        result => `done atmWithdrawalOutcome=${String(result)}`,
        error => `throw atmWithdrawalErrorClass=${isError(error) ? error.name : 'UnknownError'}`
    )
    async consolidateAtmCashWithdrawal(
        candidate: AtmCashWithdrawalCandidateInterface,
        consolidationPlan: ConsolidationPlanInterface
    ): Promise<boolean> {
        return await this.dependencies.runTransaction(this.dependencies.database, async tx =>
            this.consolidateAtmCashWithdrawalInner(candidate, consolidationPlan, tx)
        );
    }

    @Log.withoutErrorPayload(
        () => 'enter ibanBridge',
        result => `done ibanBridgeOutcome=${String(result)}`,
        error => `throw ibanBridgeErrorClass=${isError(error) ? error.name : 'UnknownError'}`
    )
    async consolidateIbanBridgeTransfer(
        candidate: IbanBridgeTransferCandidateInterface,
        consolidationPlan: ConsolidationPlanInterface
    ): Promise<boolean> {
        return await this.consolidateTwoRequiredSources(candidate.expenseTransactionId, candidate.incomeTransactionId, consolidationPlan);
    }

    @Log.withoutErrorPayload(
        () => 'enter existingTransferBridge',
        result => `done existingTransferBridgeOutcome=${String(result)}`,
        error => `throw existingTransferBridgeErrorClass=${isError(error) ? error.name : 'UnknownError'}`
    )
    async consolidateExistingTransferBridge(
        candidate: ExistingTransferBridgeCandidateInterface,
        consolidationPlan: ConsolidationPlanInterface
    ): Promise<boolean> {
        const requiredSourceTransactionIds = [
            candidate.sourceExpenseTransactionId,
            candidate.bridgeIncomeTransactionId,
            candidate.existingTransferId
        ];

        return await this.dependencies.runTransaction(this.dependencies.database, async tx =>
            this.executeRequiredSourceConsolidationPlan(consolidationPlan, requiredSourceTransactionIds, tx)
        );
    }

    @Log.withoutErrorPayload(
        () => 'enter ibanBridgeChain',
        result => `done ibanBridgeChainOutcome=${String(result)}`,
        error => `throw ibanBridgeChainErrorClass=${isError(error) ? error.name : 'UnknownError'}`
    )
    async consolidateIbanBridgeChainTransfer(
        candidate: IbanBridgeChainTransferCandidateInterface,
        consolidationPlan: ConsolidationPlanInterface
    ): Promise<boolean> {
        const requiredSourceTransactionIds = [
            candidate.sourceExpenseTransactionId,
            candidate.bridgeIncomeTransactionId,
            candidate.bridgeExpenseTransactionId,
            candidate.targetIncomeTransactionId
        ];

        return await this.dependencies.runTransaction(this.dependencies.database, async tx =>
            this.executeRequiredSourceConsolidationPlan(consolidationPlan, requiredSourceTransactionIds, tx)
        );
    }

    private async consolidateAtmCashWithdrawalInner(
        candidate: AtmCashWithdrawalCandidateInterface,
        consolidationPlan: ConsolidationPlanInterface,
        tx: DB
    ): Promise<boolean> {
        const sourceTransactions = await this.consolidationEligibilityService.findEligibleSourceTransactions(
            consolidationPlan.sourceTransactionIds,
            tx
        );

        if (!isDefined(sourceTransactions)) {
            return false;
        }

        const canonicalTransaction = await this.consolidationMutationService.createCanonicalTransfer(consolidationPlan.canonicalInput, tx);

        await this.consolidationMutationService.createAtmCashWithdrawalFeeEntry(candidate, sourceTransactions, canonicalTransaction.id, tx);
        await this.consolidationMutationService.moveSourcesToCanonical(consolidationPlan.sourceTransactionIds, canonicalTransaction.id, tx);

        return true;
    }

    private async consolidateTwoRequiredSources(
        expenseTransactionId: number,
        incomeTransactionId: number,
        consolidationPlan: ConsolidationPlanInterface
    ): Promise<boolean> {
        const requiredSourceTransactionIds = [expenseTransactionId, incomeTransactionId];

        return await this.dependencies.runTransaction(this.dependencies.database, async tx =>
            this.executeRequiredSourceConsolidationPlan(consolidationPlan, requiredSourceTransactionIds, tx)
        );
    }

    private async executeRequiredSourceConsolidationPlan(
        consolidationPlan: ConsolidationPlanInterface,
        requiredSourceTransactionIds: number[],
        tx: DB
    ): Promise<boolean> {
        if (!this.hasRequiredSourceTransactionIds(consolidationPlan, requiredSourceTransactionIds)) {
            return false;
        }

        return this.executeConsolidation(
            consolidationPlan.sourceTransactionIds,
            consolidationPlan.canonicalInput,
            tx,
            consolidationPlan.allowedMovedSourceTransactionIds
        );
    }

    private async executeConsolidation(
        sourceTransactionIds: number[],
        canonicalInput: CanonicalTransferInputInterface,
        tx: DB,
        allowedMovedSourceTransactionIds: number[] = []
    ): Promise<boolean> {
        if (
            !(await this.consolidationEligibilityService.areCandidatesStillEligible(
                sourceTransactionIds,
                tx,
                allowedMovedSourceTransactionIds
            ))
        ) {
            return false;
        }

        const canonicalTransaction = await this.consolidationMutationService.createCanonicalTransfer(canonicalInput, tx);

        await this.consolidationMutationService.moveSourcesToCanonical(sourceTransactionIds, canonicalTransaction.id, tx);

        return true;
    }

    private hasRequiredSourceTransactionIds(
        consolidationPlan: ConsolidationPlanInterface,
        requiredSourceTransactionIds: number[]
    ): boolean {
        return requiredSourceTransactionIds.every(sourceTransactionId =>
            consolidationPlan.sourceTransactionIds.includes(sourceTransactionId)
        );
    }
}
