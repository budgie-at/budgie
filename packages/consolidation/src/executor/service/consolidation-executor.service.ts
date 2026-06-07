import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

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

    @Log(
        (candidate, consolidationPlan) =>
            `enter expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} matchType=${candidate.matchType} bucket=${candidate.confidenceBucket} timeDiff=${candidate.timeDiff} sourceIds=${consolidationPlan.sourceTransactionIds.join(',')} type=${consolidationPlan.canonicalInput.consolidationType}`,
        (result, candidate, consolidationPlan) =>
            `done result=${String(result)} expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} matchType=${candidate.matchType} bucket=${candidate.confidenceBucket} timeDiff=${candidate.timeDiff} sourceIds=${consolidationPlan.sourceTransactionIds.join(',')} type=${consolidationPlan.canonicalInput.consolidationType}`,
        (error, candidate, consolidationPlan) =>
            `throw expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} matchType=${candidate.matchType} bucket=${candidate.confidenceBucket} timeDiff=${candidate.timeDiff} sourceIds=${consolidationPlan.sourceTransactionIds.join(',')} type=${consolidationPlan.canonicalInput.consolidationType} error=${getErrorMessage(error)}`
    )
    async consolidatePair(candidate: TransferPairCandidateInterface, consolidationPlan: ConsolidationPlanInterface): Promise<boolean> {
        const requiredSourceTransactionIds = [candidate.expenseTransactionId, candidate.incomeTransactionId];

        return await this.dependencies.runTransaction(this.dependencies.database, async tx =>
            this.executeRequiredSourceConsolidationPlan(consolidationPlan, requiredSourceTransactionIds, tx)
        );
    }

    @Log(
        (candidate, consolidationPlan) =>
            `enter transactionId=${candidate.transactionId} sourceAccountId=${candidate.sourceAccountId} targetCashAccountId=${candidate.targetCashAccountId} amount=${candidate.amount} sourceIds=${consolidationPlan.sourceTransactionIds.join(',')} type=${consolidationPlan.canonicalInput.consolidationType}`,
        (result, candidate, consolidationPlan) =>
            `done result=${String(result)} transactionId=${candidate.transactionId} sourceAccountId=${candidate.sourceAccountId} targetCashAccountId=${candidate.targetCashAccountId} amount=${candidate.amount} sourceIds=${consolidationPlan.sourceTransactionIds.join(',')} type=${consolidationPlan.canonicalInput.consolidationType}`,
        (error, candidate, consolidationPlan) =>
            `throw transactionId=${candidate.transactionId} sourceAccountId=${candidate.sourceAccountId} targetCashAccountId=${candidate.targetCashAccountId} amount=${candidate.amount} sourceIds=${consolidationPlan.sourceTransactionIds.join(',')} type=${consolidationPlan.canonicalInput.consolidationType} error=${getErrorMessage(error)}`
    )
    async consolidateAtmCashWithdrawal(
        candidate: AtmCashWithdrawalCandidateInterface,
        consolidationPlan: ConsolidationPlanInterface
    ): Promise<boolean> {
        return await this.dependencies.runTransaction(this.dependencies.database, async tx =>
            this.consolidateAtmCashWithdrawalInner(candidate, consolidationPlan, tx)
        );
    }

    @Log(
        (candidate, consolidationPlan) =>
            `enter expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} bridgeAmount=${candidate.bridgeAmount} exchangeRate=${candidate.exchangeRate} existingDirectTransferId=${candidate.existingDirectTransferId ?? ''} sourceIds=${consolidationPlan.sourceTransactionIds.join(',')} type=${consolidationPlan.canonicalInput.consolidationType}`,
        (result, candidate, consolidationPlan) =>
            `done result=${String(result)} expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} bridgeAmount=${candidate.bridgeAmount} exchangeRate=${candidate.exchangeRate} existingDirectTransferId=${candidate.existingDirectTransferId ?? ''} sourceIds=${consolidationPlan.sourceTransactionIds.join(',')} type=${consolidationPlan.canonicalInput.consolidationType}`,
        (error, candidate, consolidationPlan) =>
            `throw expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} bridgeAmount=${candidate.bridgeAmount} exchangeRate=${candidate.exchangeRate} existingDirectTransferId=${candidate.existingDirectTransferId ?? ''} sourceIds=${consolidationPlan.sourceTransactionIds.join(',')} type=${consolidationPlan.canonicalInput.consolidationType} error=${getErrorMessage(error)}`
    )
    async consolidateIbanBridgeTransfer(
        candidate: IbanBridgeTransferCandidateInterface,
        consolidationPlan: ConsolidationPlanInterface
    ): Promise<boolean> {
        const requiredSourceTransactionIds = [candidate.expenseTransactionId, candidate.incomeTransactionId];

        return await this.dependencies.runTransaction(this.dependencies.database, async tx =>
            this.executeRequiredSourceConsolidationPlan(consolidationPlan, requiredSourceTransactionIds, tx)
        );
    }

    @Log(
        (candidate, consolidationPlan) =>
            `enter sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} existingTransferId=${candidate.existingTransferId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} sourceAmount=${candidate.sourceAmount} targetAmount=${candidate.targetAmount} exchangeRate=${candidate.exchangeRate} sourceIds=${consolidationPlan.sourceTransactionIds.join(',')} type=${consolidationPlan.canonicalInput.consolidationType}`,
        (result, candidate, consolidationPlan) =>
            `done result=${String(result)} sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} existingTransferId=${candidate.existingTransferId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} sourceAmount=${candidate.sourceAmount} targetAmount=${candidate.targetAmount} exchangeRate=${candidate.exchangeRate} sourceIds=${consolidationPlan.sourceTransactionIds.join(',')} type=${consolidationPlan.canonicalInput.consolidationType}`,
        (error, candidate, consolidationPlan) =>
            `throw sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} existingTransferId=${candidate.existingTransferId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} sourceAmount=${candidate.sourceAmount} targetAmount=${candidate.targetAmount} exchangeRate=${candidate.exchangeRate} sourceIds=${consolidationPlan.sourceTransactionIds.join(',')} type=${consolidationPlan.canonicalInput.consolidationType} error=${getErrorMessage(error)}`
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

    @Log(
        (candidate, consolidationPlan) =>
            `enter sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} bridgeExpenseTransactionId=${candidate.bridgeExpenseTransactionId} targetIncomeTransactionId=${candidate.targetIncomeTransactionId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} sourceAmount=${candidate.sourceAmount} targetAmount=${candidate.targetAmount} exchangeRate=${candidate.exchangeRate} sourceIds=${consolidationPlan.sourceTransactionIds.join(',')} type=${consolidationPlan.canonicalInput.consolidationType}`,
        (result, candidate, consolidationPlan) =>
            `done result=${String(result)} sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} bridgeExpenseTransactionId=${candidate.bridgeExpenseTransactionId} targetIncomeTransactionId=${candidate.targetIncomeTransactionId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} sourceAmount=${candidate.sourceAmount} targetAmount=${candidate.targetAmount} exchangeRate=${candidate.exchangeRate} sourceIds=${consolidationPlan.sourceTransactionIds.join(',')} type=${consolidationPlan.canonicalInput.consolidationType}`,
        (error, candidate, consolidationPlan) =>
            `throw sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} bridgeExpenseTransactionId=${candidate.bridgeExpenseTransactionId} targetIncomeTransactionId=${candidate.targetIncomeTransactionId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} sourceAmount=${candidate.sourceAmount} targetAmount=${candidate.targetAmount} exchangeRate=${candidate.exchangeRate} sourceIds=${consolidationPlan.sourceTransactionIds.join(',')} type=${consolidationPlan.canonicalInput.consolidationType} error=${getErrorMessage(error)}`
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

    private async executeRequiredSourceConsolidationPlan(
        consolidationPlan: ConsolidationPlanInterface,
        requiredSourceTransactionIds: number[],
        tx: DB
    ): Promise<boolean> {
        if (!this.hasRequiredSourceTransactionIds(consolidationPlan, requiredSourceTransactionIds)) {
            return false;
        }

        return this.executeConsolidationPlan(consolidationPlan, tx);
    }

    private async executeConsolidationPlan(consolidationPlan: ConsolidationPlanInterface, tx: DB): Promise<boolean> {
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
