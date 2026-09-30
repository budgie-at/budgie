import { Db, TransactionConsolidationTypeEnum, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { IBAN_BRIDGE_CHAIN_FX_TOLERANCE } from '../../shared/constant/iban-bridge-chain-fx-tolerance.constant';
import { buildIbanBridgeChainCanonicalInput } from '../utils/build-iban-bridge-chain-canonical-input.util';

import { ConsolidationEligibilityService } from './consolidation-eligibility.service';
import { ConsolidationMutationService } from './consolidation-mutation.service';
import { UnconsolidationService } from './unconsolidation.service';

import type { CanonicalTransferInputInterface } from '../interface/canonical-transfer-input.interface';
import type { ConsolidationExecutorDependenciesInterface } from '../interface/consolidation-executor-dependencies.interface';
import type {
    BridgeClaimRepairCandidateInterface,
    ExistingTransferChainReclaimCandidateInterface,
    ExistingTransferIncomeDuplicateCandidateInterface,
    IbanBridgeCanonicalDuplicateCandidateInterface,
    IbanBridgeCanonicalSupersessionCandidateInterface,
    RefundCandidateInterface,
    TransactionWithEntriesEntityInterface
} from '@budgie/contracts';

export class ConsolidationRepairExecutorService {
    private static readonly MILLISECONDS_IN_SECOND = 1000;

    readonly repairP2pFiatCanonical = Effect.fnUntraced(
        function* (this: ConsolidationRepairExecutorService, canonicalTransactionId: number) {
            const canonical = yield* this.dependencies.transactionRepository.getByIdRaw(canonicalTransactionId);

            if (
                !isDefined(canonical) ||
                canonical.consolidationType !== TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER ||
                isDefined(canonical.updatedBy)
            ) {
                return false;
            }

            yield* this.unconsolidationService.unconsolidateById(canonicalTransactionId);

            return true;
        },
        effect => Db.transaction(effect)
    );

    readonly unconsolidateBridgeClaimedTransferPair = Effect.fnUntraced(
        function* (this: ConsolidationRepairExecutorService, candidate: BridgeClaimRepairCandidateInterface) {
            const canonical = yield* this.dependencies.transactionRepository.getByIdRaw(candidate.canonicalTransferId);
            const claimedIncome = yield* this.dependencies.transactionRepository.getByIdRaw(candidate.claimedIncomeTransactionId);
            const interbankExpense = yield* this.dependencies.transactionRepository.getByIdRaw(candidate.interbankExpenseTransactionId);

            if (
                !isDefined(canonical) ||
                canonical.consolidationType !== TransactionConsolidationTypeEnum.TRANSFER_PAIR ||
                !isDefined(claimedIncome) ||
                claimedIncome.consolidationParentTransactionId !== candidate.canonicalTransferId ||
                !isDefined(interbankExpense) ||
                isDefined(interbankExpense.deletedAt) ||
                isDefined(interbankExpense.consolidationParentTransactionId)
            ) {
                return false;
            }

            yield* this.unconsolidationService.unconsolidateById(candidate.canonicalTransferId);

            return true;
        },
        effect => Db.transaction(effect)
    );

    readonly consolidateIbanBridgeCanonicalDuplicate = Effect.fnUntraced(
        function* (this: ConsolidationRepairExecutorService, candidate: IbanBridgeCanonicalDuplicateCandidateInterface) {
            const sourceTransactionIds = [candidate.expenseTransactionId, candidate.incomeTransactionId];

            if (!(yield* this.consolidationEligibilityService.areCandidatesStillEligible(sourceTransactionIds))) {
                return false;
            }

            yield* this.consolidationMutationService.moveSourcesToCanonical(sourceTransactionIds, candidate.existingCanonicalTransferId);

            return true;
        },
        effect => Db.transaction(effect)
    );

    readonly consolidateIbanBridgeCanonicalSupersession = Effect.fnUntraced(
        function* (this: ConsolidationRepairExecutorService, candidate: IbanBridgeCanonicalSupersessionCandidateInterface) {
            const canonicalIdsOwningMovedEntries = [candidate.supersededCanonicalTransactionId, candidate.canonicalTransactionId];
            const transactions = yield* this.consolidationEligibilityService.findEligibleSourceTransactions(
                canonicalIdsOwningMovedEntries,
                canonicalIdsOwningMovedEntries
            );

            if (!isDefined(transactions) || !transactions.every(transaction => this.isUntouchedIbanBridgeCanonical(transaction))) {
                return false;
            }

            yield* this.consolidationMutationService.moveSourcesToCanonical(
                [candidate.supersededCanonicalTransactionId],
                candidate.canonicalTransactionId
            );

            return true;
        },
        effect => Db.transaction(effect)
    );

    readonly consolidateExistingTransferChainReclaim = Effect.fnUntraced(
        function* (this: ConsolidationRepairExecutorService, candidate: ExistingTransferChainReclaimCandidateInterface) {
            const bridgeSourceTransactionIds = [candidate.bridgeIncomeTransactionId, candidate.bridgeExpenseTransactionId];
            const existingTransfer = yield* this.findEligibleExistingTransfer(bridgeSourceTransactionIds, candidate.existingTransferId);

            if (!isDefined(existingTransfer)) {
                return false;
            }

            if (this.hasChainReclaimConsistentLedger(candidate, existingTransfer)) {
                yield* this.dependencies.transactionRepository.setConsolidationType(
                    candidate.existingTransferId,
                    TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER
                );
                yield* this.consolidationMutationService.moveSourcesToCanonical(bridgeSourceTransactionIds, candidate.existingTransferId);

                return true;
            }

            const canonicalTransaction = yield* this.consolidationMutationService.createCanonicalTransfer(
                buildIbanBridgeChainCanonicalInput({
                    title: existingTransfer.title,
                    operatedAt: candidate.operatedAt,
                    fromAccountId: candidate.sourceAccountId,
                    toAccountId: candidate.targetAccountId,
                    fromAmount: candidate.sourceAmount,
                    toAmount: candidate.targetAmount,
                    exchangeRate: candidate.exchangeRate,
                    fromEntryToIban: candidate.targetAccountIban
                })
            );

            yield* this.consolidationMutationService.moveSourcesToCanonical(
                [candidate.bridgeIncomeTransactionId, candidate.bridgeExpenseTransactionId, candidate.existingTransferId],
                canonicalTransaction.id
            );

            return true;
        },
        effect => Db.transaction(effect)
    );

    readonly consolidateExistingTransferIncomeDuplicate = Effect.fnUntraced(
        function* (this: ConsolidationRepairExecutorService, candidate: ExistingTransferIncomeDuplicateCandidateInterface) {
            const existingTransfer = yield* this.findEligibleExistingTransfer(
                [candidate.duplicateTransactionId],
                candidate.existingTransferId
            );

            if (!isDefined(existingTransfer)) {
                return false;
            }

            const canonicalTransaction = yield* this.consolidationMutationService.createCanonicalTransfer(
                this.buildIncomeDuplicateCanonicalInput(candidate, existingTransfer)
            );

            yield* this.consolidationMutationService.moveSourcesToCanonical(
                [candidate.existingTransferId, candidate.duplicateTransactionId],
                canonicalTransaction.id
            );

            return true;
        },
        effect => Db.transaction(effect)
    );

    readonly consolidateRefund = Effect.fn('ConsolidationRepairExecutorService.consolidateRefund')(
        function* (this: ConsolidationRepairExecutorService, candidate: RefundCandidateInterface) {
            const sourceTransactionIds = [candidate.expenseTransactionId, ...candidate.refundIncomeTransactionIds];

            if (
                !(yield* this.consolidationEligibilityService.areCandidatesStillEligible(sourceTransactionIds, [
                    candidate.expenseTransactionId
                ]))
            ) {
                return false;
            }

            yield* this.dependencies.transactionRepository.setConsolidationType(
                candidate.expenseTransactionId,
                TransactionConsolidationTypeEnum.REFUND
            );
            yield* this.consolidationMutationService.copySourceTags(candidate.refundIncomeTransactionIds, candidate.expenseTransactionId);
            yield* this.consolidationMutationService.moveSourcesToCanonical(
                candidate.refundIncomeTransactionIds,
                candidate.expenseTransactionId
            );

            return true;
        },
        effect => Db.transaction(effect)
    );

    private readonly consolidationEligibilityService: ConsolidationEligibilityService;

    private readonly consolidationMutationService: ConsolidationMutationService;

    private readonly unconsolidationService: UnconsolidationService;

    private readonly findEligibleExistingTransfer = Effect.fnUntraced(function* (
        this: ConsolidationRepairExecutorService,
        sourceTransactionIds: number[],
        existingTransferId: number
    ) {
        if (
            !(yield* this.consolidationEligibilityService.isExistingTransferConsolidationStillEligible(
                sourceTransactionIds,
                existingTransferId
            ))
        ) {
            return null;
        }

        const existingTransfers = yield* this.dependencies.transactionRepository.findByIds([existingTransferId]);

        return existingTransfers.at(0) ?? null;
    });

    constructor(private readonly dependencies: ConsolidationExecutorDependenciesInterface) {
        this.consolidationEligibilityService = new ConsolidationEligibilityService(dependencies);
        this.consolidationMutationService = new ConsolidationMutationService(dependencies);
        this.unconsolidationService = new UnconsolidationService(dependencies);
    }

    private isUntouchedIbanBridgeCanonical(transaction: TransactionWithEntriesEntityInterface): boolean {
        const isIbanBridgeConsolidation =
            transaction.consolidationType === TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER ||
            transaction.consolidationType === TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER;

        return transaction.type === TransactionTypeEnum.TRANSFER && !isDefined(transaction.updatedBy) && isIbanBridgeConsolidation;
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

    private buildIncomeDuplicateCanonicalInput(
        candidate: ExistingTransferIncomeDuplicateCandidateInterface,
        existingTransfer: TransactionWithEntriesEntityInterface
    ): CanonicalTransferInputInterface {
        return {
            title: isNotEmptyString(existingTransfer.title) ? existingTransfer.title : (candidate.duplicateTransactionTitle ?? ''),
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
}
