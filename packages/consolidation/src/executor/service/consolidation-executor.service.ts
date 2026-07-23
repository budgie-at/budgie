import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { ConsolidationEligibilityService } from './consolidation-eligibility.service';
import { ConsolidationMutationService } from './consolidation-mutation.service';

import type { P2pFiatTransferCandidateInterface } from '../../auto/interface/p2p-fiat-transfer-candidate.interface';
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
            `enter pair=${candidate.expenseTransactionId}/${candidate.incomeTransactionId} bucket=${candidate.confidenceBucket} plan=${consolidationPlan.sourceTransactionIds.join(',')}/${consolidationPlan.canonicalInput.consolidationType}`,
        (result, candidate, consolidationPlan) =>
            `done pairResult=${String(result)} pair=${candidate.expenseTransactionId}/${candidate.incomeTransactionId} plan=${consolidationPlan.sourceTransactionIds.join(',')}/${consolidationPlan.canonicalInput.consolidationType}`,
        (error, candidate, consolidationPlan) =>
            `throw pair=${candidate.expenseTransactionId}/${candidate.incomeTransactionId} plan=${consolidationPlan.sourceTransactionIds.join(',')}/${consolidationPlan.canonicalInput.consolidationType} error=${getErrorMessage(error)}`
    )
    async consolidatePair(candidate: TransferPairCandidateInterface, consolidationPlan: ConsolidationPlanInterface): Promise<boolean> {
        return await this.consolidateTwoRequiredSources(candidate.expenseTransactionId, candidate.incomeTransactionId, consolidationPlan);
    }

    @Log(
        (candidate, consolidationPlan) =>
            `enter atm=${candidate.transactionId} cash=${candidate.sourceAccountId}->${candidate.targetCashAccountId} amount=${candidate.amount} plan=${consolidationPlan.sourceTransactionIds.join(',')}/${consolidationPlan.canonicalInput.consolidationType}`,
        (result, candidate, consolidationPlan) =>
            `done atmResult=${String(result)} transaction=${candidate.transactionId} plan=${consolidationPlan.sourceTransactionIds.join(',')}/${consolidationPlan.canonicalInput.consolidationType}`,
        (error, candidate, consolidationPlan) =>
            `throw atm=${candidate.transactionId} plan=${consolidationPlan.sourceTransactionIds.join(',')}/${consolidationPlan.canonicalInput.consolidationType} error=${getErrorMessage(error)}`
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
            `enter ibanBridge=${candidate.expenseTransactionId}/${candidate.incomeTransactionId} route=${candidate.sourceAccountId}->${candidate.bridgeAccountId}->${candidate.targetAccountId} rate=${candidate.exchangeRate} plan=${consolidationPlan.sourceTransactionIds.join(',')}/${consolidationPlan.canonicalInput.consolidationType}`,
        (result, candidate, consolidationPlan) =>
            `done ibanBridgeResult=${String(result)} direct=${candidate.existingDirectTransferId ?? ''} plan=${consolidationPlan.sourceTransactionIds.join(',')}/${consolidationPlan.canonicalInput.consolidationType}`,
        (error, candidate, consolidationPlan) =>
            `throw ibanBridge=${candidate.expenseTransactionId}/${candidate.incomeTransactionId} amount=${candidate.bridgeAmount} plan=${consolidationPlan.sourceTransactionIds.join(',')}/${consolidationPlan.canonicalInput.consolidationType} error=${getErrorMessage(error)}`
    )
    async consolidateIbanBridgeTransfer(
        candidate: IbanBridgeTransferCandidateInterface,
        consolidationPlan: ConsolidationPlanInterface
    ): Promise<boolean> {
        return await this.consolidateTwoRequiredSources(candidate.expenseTransactionId, candidate.incomeTransactionId, consolidationPlan);
    }

    @Log(
        (candidate, consolidationPlan) =>
            `enter existingBridge=${candidate.sourceExpenseTransactionId}/${candidate.bridgeIncomeTransactionId}/${candidate.existingTransferId} route=${candidate.sourceAccountId}->${candidate.bridgeAccountId}->${candidate.targetAccountId} plan=${consolidationPlan.sourceTransactionIds.join(',')}/${consolidationPlan.canonicalInput.consolidationType}`,
        (result, candidate, consolidationPlan) =>
            `done existingBridgeResult=${String(result)} amounts=${candidate.sourceAmount}/${candidate.targetAmount} plan=${consolidationPlan.sourceTransactionIds.join(',')}/${consolidationPlan.canonicalInput.consolidationType}`,
        (error, candidate, consolidationPlan) =>
            `throw existingBridge=${candidate.sourceExpenseTransactionId}/${candidate.bridgeIncomeTransactionId}/${candidate.existingTransferId} rate=${candidate.exchangeRate} plan=${consolidationPlan.sourceTransactionIds.join(',')}/${consolidationPlan.canonicalInput.consolidationType} error=${getErrorMessage(error)}`
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
            `enter bridgeChain=${candidate.sourceExpenseTransactionId}/${candidate.bridgeIncomeTransactionId}/${candidate.bridgeExpenseTransactionId}/${candidate.targetIncomeTransactionId} route=${candidate.sourceAccountId}->${candidate.bridgeAccountId}->${candidate.targetAccountId} plan=${consolidationPlan.sourceTransactionIds.join(',')}/${consolidationPlan.canonicalInput.consolidationType}`,
        (result, candidate, consolidationPlan) =>
            `done bridgeChainResult=${String(result)} amounts=${candidate.sourceAmount}/${candidate.targetAmount} plan=${consolidationPlan.sourceTransactionIds.join(',')}/${consolidationPlan.canonicalInput.consolidationType}`,
        (error, candidate, consolidationPlan) =>
            `throw bridgeChain=${candidate.sourceExpenseTransactionId}/${candidate.bridgeIncomeTransactionId}/${candidate.bridgeExpenseTransactionId}/${candidate.targetIncomeTransactionId} rate=${candidate.exchangeRate} plan=${consolidationPlan.sourceTransactionIds.join(',')}/${consolidationPlan.canonicalInput.consolidationType} error=${getErrorMessage(error)}`
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

    @Log(
        candidate =>
            `enter p2p=${candidate.p2pTransactionId} bank=${candidate.bankTransactionIds.join(',')} direction=${candidate.direction}`,
        (result, candidate) =>
            `done p2pResult=${String(result)} p2p=${candidate.p2pTransactionId} bank=${candidate.bankTransactionIds.join(',')} direction=${candidate.direction}`,
        (error, candidate) =>
            `throw p2p=${candidate.p2pTransactionId} bank=${candidate.bankTransactionIds.join(',')} direction=${candidate.direction} error=${getErrorMessage(error)}`
    )
    async consolidateP2pFiatTransfer(candidate: P2pFiatTransferCandidateInterface): Promise<boolean> {
        return await this.dependencies.runTransaction(this.dependencies.database, async tx =>
            this.executeConsolidation(
                [...candidate.sourceTransactionIds],
                {
                    title: this.dependencies.resolveP2pTransferTitle(candidate.direction, candidate.assetCode),
                    operatedAt: candidate.operatedAt,
                    fromAccountId: candidate.fromAccountId,
                    toAccountId: candidate.toAccountId,
                    fromAmount: candidate.fromAmount,
                    toAmount: candidate.toAmount,
                    exchangeRate: candidate.fromAmount / candidate.toAmount,
                    consolidationType: TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER,
                    fromEntryExchangeRate: candidate.fromEntryExchangeRate,
                    toEntryExchangeRate: candidate.toEntryExchangeRate,
                    fromEntryToIban: candidate.fromEntryToIban
                },
                tx
            )
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
