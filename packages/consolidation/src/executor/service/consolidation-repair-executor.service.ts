import {
    Db,
    TransactionConsolidationTypeEnum,
    TransactionEntryTypeEnum,
    TransactionRepository,
    TransactionConsolidationRepository,
    TransactionTypeEnum
} from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { IBAN_BRIDGE_CHAIN_FX_TOLERANCE } from '../../shared/constant/iban-bridge-chain-fx-tolerance.constant';
import { buildIbanBridgeChainCanonicalInput } from '../utils/build-iban-bridge-chain-canonical-input.util';

import { ConsolidationEligibilityService } from './consolidation-eligibility.service';
import { ConsolidationMutationService } from './consolidation-mutation.service';
import { UnconsolidationService } from './unconsolidation.service';

import type { CanonicalTransferInputInterface } from '../interface/canonical-transfer-input.interface';
import type {
    BridgeClaimRepairCandidateInterface,
    ExistingTransferChainReclaimCandidateInterface,
    ExistingTransferIncomeDuplicateCandidateInterface,
    IbanBridgeCanonicalDuplicateCandidateInterface,
    IbanBridgeCanonicalSupersessionCandidateInterface,
    RefundCandidateInterface,
    TransactionWithEntriesEntityInterface
} from '@budgie/contracts';

export class ConsolidationRepairExecutorService extends Context.Service<ConsolidationRepairExecutorService>()(
    '@budgie/consolidation/ConsolidationRepairExecutorService',
    {
        make: Effect.gen(function* () {
            const transactionRepository = yield* TransactionRepository;
            const transactionConsolidationRepository = yield* TransactionConsolidationRepository;
            const consolidationEligibilityService = yield* ConsolidationEligibilityService;
            const consolidationMutationService = yield* ConsolidationMutationService;
            const unconsolidationService = yield* UnconsolidationService;
            const millisecondsInSecond = 1000;

            const isUntouchedIbanBridgeCanonical = (transaction: TransactionWithEntriesEntityInterface): boolean => {
                const isIbanBridgeConsolidation =
                    transaction.consolidationType === TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER ||
                    transaction.consolidationType === TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER;

                return transaction.type === TransactionTypeEnum.TRANSFER && !isDefined(transaction.updatedBy) && isIbanBridgeConsolidation;
            };

            const isWithinChainFxTolerance = (actualRate: number, expectedRate: number): boolean => {
                if (!isPositiveNumber(expectedRate)) {
                    return false;
                }

                return Math.abs(actualRate - expectedRate) / expectedRate <= IBAN_BRIDGE_CHAIN_FX_TOLERANCE;
            };

            const hasChainReclaimConsistentLedger = (
                candidate: ExistingTransferChainReclaimCandidateInterface,
                existingTransfer: TransactionWithEntriesEntityInterface
            ): boolean => {
                if (
                    existingTransfer.fromAccountId !== candidate.sourceAccountId ||
                    existingTransfer.toAccountId !== candidate.targetAccountId
                ) {
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
                    isWithinChainFxTolerance(sourceEntry.exchangeRate, candidate.exchangeRate) &&
                    isWithinChainFxTolerance(existingTransfer.exchangeRate, candidate.exchangeRate)
                );
            };

            const buildIncomeDuplicateCanonicalInput = (
                candidate: ExistingTransferIncomeDuplicateCandidateInterface,
                existingTransfer: TransactionWithEntriesEntityInterface
            ): CanonicalTransferInputInterface => ({
                title: isNotEmptyString(existingTransfer.title) ? existingTransfer.title : (candidate.duplicateTransactionTitle ?? ''),
                operatedAt: Math.floor(existingTransfer.operatedAt.getTime() / millisecondsInSecond),
                fromAccountId: candidate.sourceAccountId,
                toAccountId: candidate.targetAccountId,
                fromAmount: candidate.sourceAmount,
                toAmount: candidate.amount,
                exchangeRate: candidate.exchangeRate,
                consolidationType: TransactionConsolidationTypeEnum.TRANSFER_PAIR,
                fromEntryExchangeRate: candidate.exchangeRate,
                toEntryExchangeRate: 1,
                fromEntryToIban: existingTransfer.entries.find(entry => entry.accountId === candidate.sourceAccountId)?.toIban ?? null
            });

            const findEligibleExistingTransfer = Effect.fnUntraced(function* (sourceTransactionIds: number[], existingTransferId: number) {
                if (
                    !(yield* consolidationEligibilityService.isExistingTransferConsolidationStillEligible(
                        sourceTransactionIds,
                        existingTransferId
                    ))
                ) {
                    return null;
                }

                const existingTransfers = yield* transactionRepository.findByIds([existingTransferId]);

                return existingTransfers.at(0) ?? null;
            });

            return {
                repairP2pFiatCanonical: Effect.fnUntraced(
                    function* (canonicalTransactionId: number) {
                        const canonical = yield* transactionRepository.getByIdRaw(canonicalTransactionId);

                        if (
                            !isDefined(canonical) ||
                            canonical.consolidationType !== TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER ||
                            isDefined(canonical.updatedBy)
                        ) {
                            return false;
                        }

                        yield* unconsolidationService.unconsolidateById(canonicalTransactionId);

                        return true;
                    },
                    effect => Db.transaction(effect)
                ),
                unconsolidateBridgeClaimedTransferPair: Effect.fnUntraced(
                    function* (candidate: BridgeClaimRepairCandidateInterface) {
                        const canonical = yield* transactionRepository.getByIdRaw(candidate.canonicalTransferId);
                        const claimedIncome = yield* transactionRepository.getByIdRaw(candidate.claimedIncomeTransactionId);
                        const interbankExpense = yield* transactionRepository.getByIdRaw(candidate.interbankExpenseTransactionId);

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

                        yield* unconsolidationService.unconsolidateById(candidate.canonicalTransferId);

                        return true;
                    },
                    effect => Db.transaction(effect)
                ),
                consolidateIbanBridgeCanonicalDuplicate: Effect.fnUntraced(
                    function* (candidate: IbanBridgeCanonicalDuplicateCandidateInterface) {
                        const sourceTransactionIds = [candidate.expenseTransactionId, candidate.incomeTransactionId];

                        if (!(yield* consolidationEligibilityService.areCandidatesStillEligible(sourceTransactionIds))) {
                            return false;
                        }

                        yield* consolidationMutationService.moveSourcesToCanonical(
                            sourceTransactionIds,
                            candidate.existingCanonicalTransferId
                        );

                        return true;
                    },
                    effect => Db.transaction(effect)
                ),
                consolidateIbanBridgeCanonicalSupersession: Effect.fnUntraced(
                    function* (candidate: IbanBridgeCanonicalSupersessionCandidateInterface) {
                        const canonicalIdsOwningMovedEntries = [
                            candidate.supersededCanonicalTransactionId,
                            candidate.canonicalTransactionId
                        ];
                        const transactions = yield* consolidationEligibilityService.findEligibleSourceTransactions(
                            canonicalIdsOwningMovedEntries,
                            canonicalIdsOwningMovedEntries
                        );

                        if (!isDefined(transactions) || !transactions.every(transaction => isUntouchedIbanBridgeCanonical(transaction))) {
                            return false;
                        }

                        yield* consolidationMutationService.moveSourcesToCanonical(
                            [candidate.supersededCanonicalTransactionId],
                            candidate.canonicalTransactionId
                        );

                        return true;
                    },
                    effect => Db.transaction(effect)
                ),
                consolidateExistingTransferChainReclaim: Effect.fnUntraced(
                    function* (candidate: ExistingTransferChainReclaimCandidateInterface) {
                        const bridgeSourceTransactionIds = [candidate.bridgeIncomeTransactionId, candidate.bridgeExpenseTransactionId];
                        const existingTransfer = yield* findEligibleExistingTransfer(
                            bridgeSourceTransactionIds,
                            candidate.existingTransferId
                        );

                        if (!isDefined(existingTransfer)) {
                            return false;
                        }

                        if (hasChainReclaimConsistentLedger(candidate, existingTransfer)) {
                            yield* transactionConsolidationRepository.setConsolidationType(
                                candidate.existingTransferId,
                                TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER
                            );
                            yield* consolidationMutationService.moveSourcesToCanonical(
                                bridgeSourceTransactionIds,
                                candidate.existingTransferId
                            );

                            return true;
                        }

                        const canonicalTransaction = yield* consolidationMutationService.createCanonicalTransfer(
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

                        yield* consolidationMutationService.moveSourcesToCanonical(
                            [candidate.bridgeIncomeTransactionId, candidate.bridgeExpenseTransactionId, candidate.existingTransferId],
                            canonicalTransaction.id
                        );

                        return true;
                    },
                    effect => Db.transaction(effect)
                ),
                consolidateExistingTransferIncomeDuplicate: Effect.fnUntraced(
                    function* (candidate: ExistingTransferIncomeDuplicateCandidateInterface) {
                        const existingTransfer = yield* findEligibleExistingTransfer(
                            [candidate.duplicateTransactionId],
                            candidate.existingTransferId
                        );

                        if (!isDefined(existingTransfer)) {
                            return false;
                        }

                        const canonicalTransaction = yield* consolidationMutationService.createCanonicalTransfer(
                            buildIncomeDuplicateCanonicalInput(candidate, existingTransfer)
                        );

                        yield* consolidationMutationService.moveSourcesToCanonical(
                            [candidate.existingTransferId, candidate.duplicateTransactionId],
                            canonicalTransaction.id
                        );

                        return true;
                    },
                    effect => Db.transaction(effect)
                ),
                consolidateRefund: Effect.fn('ConsolidationRepairExecutorService.consolidateRefund')(
                    function* (candidate: RefundCandidateInterface) {
                        const sourceTransactionIds = [candidate.expenseTransactionId, ...candidate.refundIncomeTransactionIds];

                        if (
                            !(yield* consolidationEligibilityService.areCandidatesStillEligible(sourceTransactionIds, [
                                candidate.expenseTransactionId
                            ]))
                        ) {
                            return false;
                        }

                        yield* transactionConsolidationRepository.setConsolidationType(
                            candidate.expenseTransactionId,
                            TransactionConsolidationTypeEnum.REFUND
                        );
                        yield* consolidationMutationService.copySourceTags(
                            candidate.refundIncomeTransactionIds,
                            candidate.expenseTransactionId
                        );
                        yield* consolidationMutationService.moveSourcesToCanonical(
                            candidate.refundIncomeTransactionIds,
                            candidate.expenseTransactionId
                        );

                        return true;
                    },
                    effect => Db.transaction(effect)
                )
            };
        })
    }
) {
    static readonly layer = Layer.effect(ConsolidationRepairExecutorService, ConsolidationRepairExecutorService.make).pipe(
        Layer.provide([
            TransactionRepository.layer,
            TransactionConsolidationRepository.layer,
            ConsolidationEligibilityService.layer,
            ConsolidationMutationService.layer,
            UnconsolidationService.layer
        ])
    );
}
