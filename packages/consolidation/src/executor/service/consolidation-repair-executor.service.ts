import { TransactionConsolidationTypeEnum, TransactionEntryTypeEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

import { IBAN_BRIDGE_CHAIN_FX_TOLERANCE } from '../../shared/constant/iban-bridge-chain-fx-tolerance.constant';
import { buildIbanBridgeChainCanonicalInput } from '../utils/build-iban-bridge-chain-canonical-input.util';

import { ConsolidationEligibilityService } from './consolidation-eligibility.service';
import { ConsolidationMutationService } from './consolidation-mutation.service';
import { UnconsolidationService } from './unconsolidation.service';

import type { CanonicalTransferInputInterface } from '../interface/canonical-transfer-input.interface';
import type { ConsolidationExecutorDependenciesInterface } from '../interface/consolidation-executor-dependencies.interface';
import type {
    DB,
    ExistingTransferChainReclaimCandidateInterface,
    ExistingTransferIncomeDuplicateCandidateInterface,
    IbanBridgeCanonicalDuplicateCandidateInterface,
    RefundCandidateInterface,
    TransactionWithEntriesEntityInterface
} from '@budgie/contracts';

export class ConsolidationRepairExecutorService {
    private static readonly MILLISECONDS_IN_SECOND = 1000;

    private readonly consolidationEligibilityService: ConsolidationEligibilityService;

    private readonly consolidationMutationService: ConsolidationMutationService;

    private readonly unconsolidationService: UnconsolidationService;

    constructor(private readonly dependencies: ConsolidationExecutorDependenciesInterface) {
        this.consolidationEligibilityService = new ConsolidationEligibilityService(dependencies);
        this.consolidationMutationService = new ConsolidationMutationService(dependencies);
        this.unconsolidationService = new UnconsolidationService(dependencies);
    }

    @Log(
        canonicalTransactionId => `enter canonicalTransactionId=${canonicalTransactionId}`,
        (result, canonicalTransactionId) => `done result=${String(result)} canonicalTransactionId=${canonicalTransactionId}`,
        (error, canonicalTransactionId) => `throw canonicalTransactionId=${canonicalTransactionId} error=${getErrorMessage(error)}`
    )
    async repairP2pFiatCanonical(canonicalTransactionId: number): Promise<boolean> {
        return this.dependencies.runTransaction(this.dependencies.database, async tx => {
            const canonical = await this.dependencies.transactionRepository.getByIdRaw(canonicalTransactionId, tx);
            if (
                !isDefined(canonical) ||
                canonical.consolidationType !== TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER ||
                isDefined(canonical.updatedBy)
            ) {
                return false;
            }

            await this.unconsolidationService.unconsolidateById(canonicalTransactionId, tx);

            return true;
        });
    }

    @Log(
        candidate =>
            `enter expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} existingCanonicalTransferId=${candidate.existingCanonicalTransferId} sourceAccountId=${candidate.sourceAccountId} targetAccountId=${candidate.targetAccountId} timeDiff=${candidate.timeDiff}`,
        (result, candidate) =>
            `done result=${String(result)} expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} existingCanonicalTransferId=${candidate.existingCanonicalTransferId} sourceAccountId=${candidate.sourceAccountId} targetAccountId=${candidate.targetAccountId} timeDiff=${candidate.timeDiff}`,
        (error, candidate) =>
            `throw expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} existingCanonicalTransferId=${candidate.existingCanonicalTransferId} sourceAccountId=${candidate.sourceAccountId} targetAccountId=${candidate.targetAccountId} timeDiff=${candidate.timeDiff} error=${getErrorMessage(error)}`
    )
    async consolidateIbanBridgeCanonicalDuplicate(candidate: IbanBridgeCanonicalDuplicateCandidateInterface): Promise<boolean> {
        return await this.dependencies.runTransaction(this.dependencies.database, async tx =>
            this.consolidateIbanBridgeCanonicalDuplicateInner(candidate, tx)
        );
    }

    @Log(
        candidate =>
            `enter existingTransferId=${candidate.existingTransferId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} bridgeExpenseTransactionId=${candidate.bridgeExpenseTransactionId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} sourceAmount=${candidate.sourceAmount} bridgeAmount=${candidate.bridgeAmount} targetAmount=${candidate.targetAmount} exchangeRate=${candidate.exchangeRate}`,
        (result, candidate) =>
            `done result=${String(result)} existingTransferId=${candidate.existingTransferId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} bridgeExpenseTransactionId=${candidate.bridgeExpenseTransactionId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} sourceAmount=${candidate.sourceAmount} bridgeAmount=${candidate.bridgeAmount} targetAmount=${candidate.targetAmount} exchangeRate=${candidate.exchangeRate}`,
        (error, candidate) =>
            `throw existingTransferId=${candidate.existingTransferId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} bridgeExpenseTransactionId=${candidate.bridgeExpenseTransactionId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} sourceAmount=${candidate.sourceAmount} bridgeAmount=${candidate.bridgeAmount} targetAmount=${candidate.targetAmount} exchangeRate=${candidate.exchangeRate} error=${getErrorMessage(error)}`
    )
    async consolidateExistingTransferChainReclaim(candidate: ExistingTransferChainReclaimCandidateInterface): Promise<boolean> {
        return await this.dependencies.runTransaction(this.dependencies.database, async tx =>
            this.consolidateExistingTransferChainReclaimInner(candidate, tx)
        );
    }

    @Log(
        candidate =>
            `enter existingTransferId=${candidate.existingTransferId} incomeTransactionId=${candidate.incomeTransactionId} sourceAccountId=${candidate.sourceAccountId} targetAccountId=${candidate.targetAccountId} targetEntryId=${candidate.existingTransferTargetEntryId} sourceAmount=${candidate.sourceAmount} amount=${candidate.amount} exchangeRate=${candidate.exchangeRate} amountDelta=${candidate.amountDelta} timeDiff=${candidate.timeDiff}`,
        (result, candidate) =>
            `done result=${String(result)} existingTransferId=${candidate.existingTransferId} incomeTransactionId=${candidate.incomeTransactionId} sourceAccountId=${candidate.sourceAccountId} targetAccountId=${candidate.targetAccountId} targetEntryId=${candidate.existingTransferTargetEntryId} sourceAmount=${candidate.sourceAmount} amount=${candidate.amount} exchangeRate=${candidate.exchangeRate} amountDelta=${candidate.amountDelta} timeDiff=${candidate.timeDiff}`,
        (error, candidate) =>
            `throw existingTransferId=${candidate.existingTransferId} incomeTransactionId=${candidate.incomeTransactionId} sourceAccountId=${candidate.sourceAccountId} targetAccountId=${candidate.targetAccountId} targetEntryId=${candidate.existingTransferTargetEntryId} sourceAmount=${candidate.sourceAmount} amount=${candidate.amount} exchangeRate=${candidate.exchangeRate} amountDelta=${candidate.amountDelta} timeDiff=${candidate.timeDiff} error=${getErrorMessage(error)}`
    )
    async consolidateExistingTransferIncomeDuplicate(candidate: ExistingTransferIncomeDuplicateCandidateInterface): Promise<boolean> {
        return await this.dependencies.runTransaction(this.dependencies.database, async tx =>
            this.consolidateExistingTransferIncomeDuplicateInner(candidate, tx)
        );
    }

    @Log(
        candidate =>
            `enter expenseTransactionId=${candidate.expenseTransactionId} accountId=${candidate.accountId} refundIncomeTransactionIds=${candidate.refundIncomeTransactionIds.join(',')} refundsTotal=${candidate.refundsTotal} expenseEntryAmount=${candidate.expenseEntryAmount}`,
        (result, candidate) =>
            `done result=${String(result)} expenseTransactionId=${candidate.expenseTransactionId} refundIncomeTransactionIds=${candidate.refundIncomeTransactionIds.join(',')} refundsTotal=${candidate.refundsTotal}`,
        (error, candidate) =>
            `throw expenseTransactionId=${candidate.expenseTransactionId} refundIncomeTransactionIds=${candidate.refundIncomeTransactionIds.join(',')} refundsTotal=${candidate.refundsTotal} error=${getErrorMessage(error)}`
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

    private async findEligibleExistingTransfer(
        sourceTransactionIds: number[],
        existingTransferId: number,
        tx: DB
    ): Promise<TransactionWithEntriesEntityInterface | null> {
        if (
            !(await this.consolidationEligibilityService.isExistingTransferConsolidationStillEligible(
                sourceTransactionIds,
                existingTransferId,
                tx
            ))
        ) {
            return null;
        }

        const [existingTransfer] = await this.dependencies.transactionRepository.findByIds([existingTransferId], tx);

        return existingTransfer;
    }

    private async consolidateExistingTransferChainReclaimInner(
        candidate: ExistingTransferChainReclaimCandidateInterface,
        tx: DB
    ): Promise<boolean> {
        const bridgeSourceTransactionIds = [candidate.bridgeIncomeTransactionId, candidate.bridgeExpenseTransactionId];
        const existingTransfer = await this.findEligibleExistingTransfer(bridgeSourceTransactionIds, candidate.existingTransferId, tx);

        if (!isDefined(existingTransfer)) {
            return false;
        }

        if (this.hasChainReclaimConsistentLedger(candidate, existingTransfer)) {
            return this.absorbChainReclaimBridgeLegs(candidate, bridgeSourceTransactionIds, tx);
        }

        return this.rebuildChainReclaimCanonical(candidate, existingTransfer.title, tx);
    }

    private async absorbChainReclaimBridgeLegs(
        candidate: ExistingTransferChainReclaimCandidateInterface,
        bridgeSourceTransactionIds: number[],
        tx: DB
    ): Promise<boolean> {
        await this.dependencies.transactionRepository.setConsolidationType(
            candidate.existingTransferId,
            TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER,
            tx
        );
        await this.consolidationMutationService.moveSourcesToCanonical(bridgeSourceTransactionIds, candidate.existingTransferId, tx);

        return true;
    }

    private async rebuildChainReclaimCanonical(
        candidate: ExistingTransferChainReclaimCandidateInterface,
        existingTransferTitle: string,
        tx: DB
    ): Promise<boolean> {
        const canonicalTransaction = await this.consolidationMutationService.createCanonicalTransfer(
            buildIbanBridgeChainCanonicalInput({
                title: existingTransferTitle,
                operatedAt: candidate.operatedAt,
                fromAccountId: candidate.sourceAccountId,
                toAccountId: candidate.targetAccountId,
                fromAmount: candidate.sourceAmount,
                toAmount: candidate.targetAmount,
                exchangeRate: candidate.exchangeRate,
                fromEntryToIban: candidate.targetAccountIban
            }),
            tx
        );

        await this.consolidationMutationService.moveSourcesToCanonical(
            [candidate.bridgeIncomeTransactionId, candidate.bridgeExpenseTransactionId, candidate.existingTransferId],
            canonicalTransaction.id,
            tx
        );

        return true;
    }

    private hasChainReclaimConsistentLedger(
        candidate: ExistingTransferChainReclaimCandidateInterface,
        existingTransfer: TransactionWithEntriesEntityInterface
    ): boolean {
        if (existingTransfer.fromAccountId !== candidate.sourceAccountId || existingTransfer.toAccountId !== candidate.targetAccountId) {
            return false;
        }

        const sourceEntry = existingTransfer.entries.find(
            entry => entry.accountId === candidate.sourceAccountId && entry.type === TransactionEntryTypeEnum.CREDIT
        );
        const targetEntry = existingTransfer.entries.find(
            entry => entry.accountId === candidate.targetAccountId && entry.type === TransactionEntryTypeEnum.DEBIT
        );

        if (!isDefined(sourceEntry) || !isDefined(targetEntry)) {
            return false;
        }

        return (
            sourceEntry.amount === candidate.sourceAmount &&
            targetEntry.amount === candidate.targetAmount &&
            targetEntry.exchangeRate === 1 &&
            sourceEntry.toIban === candidate.targetAccountIban &&
            this.isWithinChainFxTolerance(sourceEntry.exchangeRate, candidate.exchangeRate) &&
            this.isWithinChainFxTolerance(existingTransfer.exchangeRate, candidate.exchangeRate)
        );
    }

    private isWithinChainFxTolerance(actualRate: number, expectedRate: number): boolean {
        if (!isPositiveNumber(expectedRate)) {
            return false;
        }

        return Math.abs(actualRate - expectedRate) / expectedRate <= IBAN_BRIDGE_CHAIN_FX_TOLERANCE;
    }

    private async consolidateExistingTransferIncomeDuplicateInner(
        candidate: ExistingTransferIncomeDuplicateCandidateInterface,
        tx: DB
    ): Promise<boolean> {
        const existingTransfer = await this.findEligibleExistingTransfer([candidate.incomeTransactionId], candidate.existingTransferId, tx);

        if (!isDefined(existingTransfer)) {
            return false;
        }

        const canonicalTransaction = await this.consolidationMutationService.createCanonicalTransfer(
            this.buildIncomeDuplicateCanonicalInput(candidate, existingTransfer),
            tx
        );

        await this.consolidationMutationService.moveSourcesToCanonical(
            [candidate.existingTransferId, candidate.incomeTransactionId],
            canonicalTransaction.id,
            tx
        );

        return true;
    }

    private buildIncomeDuplicateCanonicalInput(
        candidate: ExistingTransferIncomeDuplicateCandidateInterface,
        existingTransfer: TransactionWithEntriesEntityInterface
    ): CanonicalTransferInputInterface {
        return {
            title: existingTransfer.title,
            operatedAt: Math.floor(existingTransfer.operatedAt.getTime() / ConsolidationRepairExecutorService.MILLISECONDS_IN_SECOND),
            fromAccountId: candidate.sourceAccountId,
            toAccountId: candidate.targetAccountId,
            fromAmount: candidate.sourceAmount,
            toAmount: candidate.amount,
            exchangeRate: candidate.exchangeRate,
            consolidationType: TransactionConsolidationTypeEnum.TRANSFER_PAIR,
            fromEntryExchangeRate: candidate.exchangeRate,
            toEntryExchangeRate: 1,
            fromEntryToIban: existingTransfer.entries.find(entry => entry.accountId === candidate.sourceAccountId)?.toIban ?? null
        };
    }

    private async consolidateRefundInner(candidate: RefundCandidateInterface, tx: DB): Promise<boolean> {
        const sourceTransactionIds = [candidate.expenseTransactionId, ...candidate.refundIncomeTransactionIds];

        if (
            !(await this.consolidationEligibilityService.areCandidatesStillEligible(sourceTransactionIds, tx, [
                candidate.expenseTransactionId
            ]))
        ) {
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
