import {
    Db,
    DebtEventRepository,
    ExternalSourceEnum,
    REFUND_TITLE_PREFIXES,
    TransactionConsolidationTypeEnum,
    TransactionEntryTypeEnum,
    TransactionRepository,
    TransactionConsolidationRepository,
    TransactionReceiptRepository,
    TransactionTypeEnum
} from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isEmptyArray, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { isPrivatbankClosedByAbsorbedRefunds } from '../../refund/utils/is-privatbank-closed-by-absorbed-refunds.util';
import { IBAN_BRIDGE_CHAIN_FX_TOLERANCE } from '../../shared/constant/iban-bridge-chain-fx-tolerance.constant';
import { isPrivatbankSameOriginalAmount } from '../../shared/utils/is-privatbank-same-original-amount.util';
import { IbanBridgeClaimRollbackError } from '../error/iban-bridge-claim-rollback.error';
import { buildIbanBridgeChainCanonicalInput } from '../utils/build-iban-bridge-chain-canonical-input.util';

import { ConsolidationEligibilityService } from './consolidation-eligibility.service';
import { ConsolidationMutationService } from './consolidation-mutation.service';
import { UnconsolidationService } from './unconsolidation.service';

import type { IbanBridgeDuplicatePairCandidateInterface } from '../../query/interface/iban-bridge-duplicate-pair-candidate.interface';
import type { IbanBridgeEndLegCandidateInterface } from '../../query/interface/iban-bridge-end-leg-candidate.interface';
import type { ManualExpenseDuplicateCandidateInterface } from '../../query/interface/manual-expense-duplicate-candidate.interface';
import type {
    BridgeClaimRepairCandidateInterface,
    ExistingTransferChainReclaimCandidateInterface,
    ExistingTransferIncomeDuplicateCandidateInterface,
    IbanBridgeCanonicalDuplicateCandidateInterface,
    IbanBridgeCanonicalSupersessionCandidateInterface,
    RefundCandidateInterface,
    TransactionEntityInterface,
    TransactionEntryEntityInterface,
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
            const debtEventRepository = yield* DebtEventRepository;
            const transactionReceiptRepository = yield* TransactionReceiptRepository;
            const millisecondsInSecond = 1000;
            const upperRejectedPaymentFeePrefixes = REFUND_TITLE_PREFIXES.rejectedPaymentFee.map(prefix => prefix.toUpperCase());

            const sumAmounts = (entries: readonly TransactionEntryEntityInterface[]): number =>
                entries.reduce((total, entry) => total + entry.amount, 0);

            const findById = (transactions: readonly TransactionWithEntriesEntityInterface[] | null | undefined, id: number) =>
                transactions?.find(transaction => transaction.id === id);

            const isRejectedPaymentFeeTitle = (title: string): boolean => {
                const normalizedTitle = title.trim().toUpperCase();

                return upperRejectedPaymentFeePrefixes.some(prefix => normalizedTitle.startsWith(prefix));
            };

            const isLiveEditableRoot = (transaction: TransactionEntityInterface): boolean =>
                !isDefined(transaction.updatedBy) &&
                !isDefined(transaction.deletedAt) &&
                !isDefined(transaction.consolidationParentTransactionId);

            const isLiveEditableOfType = (
                transaction: TransactionEntityInterface | undefined,
                consolidationType: TransactionConsolidationTypeEnum
            ): boolean => isDefined(transaction) && transaction.consolidationType === consolidationType && isLiveEditableRoot(transaction);

            const isUntouchedIbanBridgeCanonical = (transaction: TransactionEntityInterface | undefined): boolean =>
                isDefined(transaction) &&
                transaction.type === TransactionTypeEnum.TRANSFER &&
                isLiveEditableRoot(transaction) &&
                (transaction.consolidationType === TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER ||
                    transaction.consolidationType === TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER);

            const isLiveAccountEntry = (
                entry: TransactionEntryEntityInterface,
                type: TransactionEntryTypeEnum,
                accountId: number
            ): boolean => entry.type === type && entry.accountId === accountId && !isDefined(entry.originalTransactionId);

            const isOpenRefundIncome = (refund: TransactionWithEntriesEntityInterface): boolean =>
                refund.type === TransactionTypeEnum.INCOME &&
                !isDefined(refund.deletedAt) &&
                !isDefined(refund.consolidationType) &&
                !isDefined(refund.consolidationParentTransactionId) &&
                !refund.refundAutoPairDisabled;

            const isWithinChainFxTolerance = (actualRate: number, expectedRate: number): boolean =>
                isPositiveNumber(expectedRate) && Math.abs(actualRate - expectedRate) / expectedRate <= IBAN_BRIDGE_CHAIN_FX_TOLERANCE;

            const isCaptureManualSource = (externalSource: ExternalSourceEnum | null): boolean =>
                externalSource === ExternalSourceEnum.APPLE_PAY_AUTOMATION || externalSource === ExternalSourceEnum.RECEIPT;

            const hasFreshRefundCapacity = Effect.fnUntraced(function* (candidate: RefundCandidateInterface) {
                const uniqueRefundIds = [...new Set(candidate.refundIncomeTransactionIds)];

                if (
                    isEmptyArray(uniqueRefundIds) ||
                    uniqueRefundIds.length !== candidate.refundIncomeTransactionIds.length ||
                    uniqueRefundIds.includes(candidate.expenseTransactionId)
                ) {
                    return false;
                }

                const transactions = yield* transactionRepository.findByIdsWithRefundConsolidationHistory([
                    candidate.expenseTransactionId,
                    ...uniqueRefundIds
                ]);
                const expense = findById(transactions, candidate.expenseTransactionId);
                const openRefunds = transactions
                    .filter(transaction => uniqueRefundIds.includes(transaction.id) && isOpenRefundIncome(transaction))
                    .flatMap(refund => {
                        const [entry, ...siblingEntries] = refund.entries;
                        const isSoleLiveDebit =
                            isDefined(entry) &&
                            isEmptyArray(siblingEntries) &&
                            entry.type === TransactionEntryTypeEnum.DEBIT &&
                            entry.accountId === candidate.accountId &&
                            !isDefined(entry.originalTransactionId) &&
                            isPositiveNumber(entry.amount);

                        return isSoleLiveDebit ? [{ entry, source: refund.externalSource ?? null }] : [];
                    });
                const creditEntry = expense?.entries.find(entry =>
                    isLiveAccountEntry(entry, TransactionEntryTypeEnum.CREDIT, candidate.accountId)
                );

                if (
                    !isDefined(expense) ||
                    !isDefined(creditEntry) ||
                    isDefined(expense.deletedAt) ||
                    isDefined(expense.consolidationParentTransactionId) ||
                    expense.type !== TransactionTypeEnum.EXPENSE ||
                    (isDefined(expense.consolidationType) && expense.consolidationType !== TransactionConsolidationTypeEnum.REFUND) ||
                    openRefunds.length !== uniqueRefundIds.length
                ) {
                    return false;
                }

                const absorbedEntries = expense.entries.filter(
                    entry => entry.type === TransactionEntryTypeEnum.DEBIT && isDefined(entry.originalTransactionId)
                );
                const absorbedSourceById = new Map(
                    (isNotEmptyArray(absorbedEntries)
                        ? yield* transactionRepository.findByIds(
                              absorbedEntries.map(entry => entry.originalTransactionId).filter(isDefined)
                          )
                        : []
                    ).map(source => [source.id, source])
                );
                const expenseSource = expense.externalSource ?? null;

                if (isPrivatbankClosedByAbsorbedRefunds(absorbedEntries, absorbedSourceById, expenseSource, creditEntry)) {
                    return false;
                }

                const feeAmount = sumAmounts(
                    expense.entries.filter(
                        entry =>
                            isLiveAccountEntry(entry, TransactionEntryTypeEnum.FEE, candidate.accountId) && isPositiveNumber(entry.amount)
                    )
                );
                const rawAbsorbedFeeTotal = sumAmounts(
                    absorbedEntries.filter(entry =>
                        isRejectedPaymentFeeTitle(absorbedSourceById.get(entry.originalTransactionId ?? 0)?.title ?? '')
                    )
                );
                const absorbedFeeTotal = Math.min(rawAbsorbedFeeTotal, feeAmount);
                const absorbedPrincipalTotal = sumAmounts(absorbedEntries) - absorbedFeeTotal;
                const refundTotal = sumAmounts(openRefunds.map(({ entry }) => entry));
                const isFeeGroup = candidate.confidenceBucket === 'AUTO_REFUND_REJECTED_PAYMENT_FEE_TITLE';

                if (
                    !isFeeGroup &&
                    openRefunds.some(({ entry, source }) => isPrivatbankSameOriginalAmount(source, entry, expenseSource, creditEntry))
                ) {
                    return openRefunds.length === 1 && absorbedPrincipalTotal === 0;
                }

                return isFeeGroup
                    ? absorbedFeeTotal + refundTotal <= feeAmount
                    : absorbedPrincipalTotal + refundTotal <= creditEntry.amount;
            });

            const hasChainReclaimConsistentLedger = (
                candidate: ExistingTransferChainReclaimCandidateInterface,
                existingTransfer: TransactionWithEntriesEntityInterface
            ): boolean => {
                const sourceEntry = existingTransfer.entries.find(
                    entry => entry.accountId === candidate.sourceAccountId && entry.type === TransactionEntryTypeEnum.CREDIT
                );
                const targetEntry = existingTransfer.entries.find(
                    entry => entry.accountId === candidate.targetAccountId && entry.type === TransactionEntryTypeEnum.DEBIT
                );

                return (
                    existingTransfer.fromAccountId === candidate.sourceAccountId &&
                    existingTransfer.toAccountId === candidate.targetAccountId &&
                    isDefined(sourceEntry) &&
                    isDefined(targetEntry) &&
                    sourceEntry.amount === candidate.sourceAmount &&
                    targetEntry.amount === candidate.targetAmount &&
                    targetEntry.exchangeRate === 1 &&
                    sourceEntry.toIban === candidate.targetAccountIban &&
                    isWithinChainFxTolerance(sourceEntry.exchangeRate, candidate.exchangeRate) &&
                    isWithinChainFxTolerance(existingTransfer.exchangeRate, candidate.exchangeRate)
                );
            };

            const claimIbanBridgeEndLegs = Effect.fnUntraced(function* (
                canonical: TransactionWithEntriesEntityInterface,
                endLegTransactionIds: number[],
                accountIds: number[]
            ) {
                const endLegs = yield* consolidationEligibilityService.findEligibleSourceTransactions(endLegTransactionIds);

                if (!isDefined(endLegs)) {
                    return false;
                }

                yield* consolidationMutationService.createMissingTransferFeeEntries(canonical.entries, endLegs, canonical.id, accountIds);
                yield* consolidationMutationService.moveSourcesToCanonical(endLegTransactionIds, canonical.id);

                return true;
            });

            return {
                consolidateIbanBridgeEndLeg: Effect.fn('ConsolidationRepairExecutorService.consolidateIbanBridgeEndLeg')(
                    function* (candidate: IbanBridgeEndLegCandidateInterface) {
                        const canonical = yield* transactionRepository.getByIdWithEntries(candidate.canonicalTransactionId);

                        if (
                            !isDefined(canonical) ||
                            !isLiveEditableOfType(canonical, TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER)
                        ) {
                            return false;
                        }

                        return yield* claimIbanBridgeEndLegs(canonical, [candidate.endLegTransactionId], [candidate.accountId]);
                    },
                    effect => Db.transaction(effect)
                ),
                consolidateIbanBridgeDuplicatePair: Effect.fn('ConsolidationRepairExecutorService.consolidateIbanBridgeDuplicatePair')(
                    function* (candidate: IbanBridgeDuplicatePairCandidateInterface) {
                        if (candidate.pairTransactionId === candidate.bridgeTransactionId) {
                            return false;
                        }

                        const transactions = yield* transactionRepository.findByIds([
                            candidate.pairTransactionId,
                            candidate.bridgeTransactionId
                        ]);
                        const pair = findById(transactions, candidate.pairTransactionId);
                        const bridge = findById(transactions, candidate.bridgeTransactionId);

                        if (
                            !isDefined(pair) ||
                            !isLiveEditableOfType(pair, TransactionConsolidationTypeEnum.TRANSFER_PAIR) ||
                            !isDefined(bridge) ||
                            !isLiveEditableOfType(bridge, TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER)
                        ) {
                            return false;
                        }

                        yield* unconsolidationService.unconsolidateById(candidate.pairTransactionId);

                        const claimed = yield* claimIbanBridgeEndLegs(
                            bridge,
                            [candidate.sourceExpenseTransactionId, candidate.targetIncomeTransactionId],
                            [pair.fromAccountId, pair.toAccountId].filter(isDefined)
                        );

                        if (!claimed) {
                            return yield* IbanBridgeClaimRollbackError.make();
                        }

                        return true;
                    },
                    effect => Db.transaction(effect).pipe(Effect.catchTag('IbanBridgeClaimRollbackError', () => Effect.succeed(false)))
                ),
                repairP2pFiatCanonical: Effect.fn('ConsolidationRepairExecutorService.repairP2pFiatCanonical')(
                    function* (canonicalTransactionId: number) {
                        const canonical = yield* transactionRepository.getByIdRaw(canonicalTransactionId);

                        if (!isLiveEditableOfType(canonical, TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER)) {
                            return false;
                        }

                        yield* unconsolidationService.unconsolidateById(canonicalTransactionId);

                        return true;
                    },
                    effect => Db.transaction(effect)
                ),
                unconsolidateBridgeClaimedTransferPair: Effect.fn(
                    'ConsolidationRepairExecutorService.unconsolidateBridgeClaimedTransferPair'
                )(
                    function* (candidate: BridgeClaimRepairCandidateInterface) {
                        const transactions = yield* transactionRepository.findByIds([
                            candidate.canonicalTransferId,
                            candidate.claimedIncomeTransactionId,
                            candidate.interbankExpenseTransactionId
                        ]);
                        const canonical = findById(transactions, candidate.canonicalTransferId);
                        const claimedIncome = findById(transactions, candidate.claimedIncomeTransactionId);
                        const interbankExpense = findById(transactions, candidate.interbankExpenseTransactionId);

                        if (
                            !isLiveEditableOfType(canonical, TransactionConsolidationTypeEnum.TRANSFER_PAIR) ||
                            claimedIncome?.consolidationParentTransactionId !== candidate.canonicalTransferId ||
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
                consolidateIbanBridgeCanonicalDuplicate: Effect.fn(
                    'ConsolidationRepairExecutorService.consolidateIbanBridgeCanonicalDuplicate'
                )(
                    function* (candidate: IbanBridgeCanonicalDuplicateCandidateInterface) {
                        const sourceTransactionIds = [candidate.expenseTransactionId, candidate.incomeTransactionId];

                        if (sourceTransactionIds.includes(candidate.existingCanonicalTransferId)) {
                            return false;
                        }

                        const existingCanonical = yield* transactionRepository.getByIdRaw(candidate.existingCanonicalTransferId);

                        if (
                            !isUntouchedIbanBridgeCanonical(existingCanonical) ||
                            !(yield* consolidationEligibilityService.areCandidatesStillEligible(sourceTransactionIds))
                        ) {
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
                consolidateIbanBridgeCanonicalSupersession: Effect.fn(
                    'ConsolidationRepairExecutorService.consolidateIbanBridgeCanonicalSupersession'
                )(
                    function* (candidate: IbanBridgeCanonicalSupersessionCandidateInterface) {
                        const canonicalIds = [candidate.supersededCanonicalTransactionId, candidate.canonicalTransactionId];
                        const transactions = yield* consolidationEligibilityService.findEligibleSourceTransactions(
                            canonicalIds,
                            canonicalIds
                        );
                        const supersededCanonical = findById(transactions, candidate.supersededCanonicalTransactionId);
                        const survivingCanonical = findById(transactions, candidate.canonicalTransactionId);

                        if (
                            !isDefined(supersededCanonical) ||
                            !isDefined(survivingCanonical) ||
                            !isUntouchedIbanBridgeCanonical(supersededCanonical) ||
                            !isUntouchedIbanBridgeCanonical(survivingCanonical)
                        ) {
                            return false;
                        }

                        yield* consolidationMutationService.createMissingTransferFeeEntries(
                            survivingCanonical.entries,
                            [supersededCanonical],
                            survivingCanonical.id
                        );
                        yield* consolidationMutationService.moveSourcesToCanonical(
                            [candidate.supersededCanonicalTransactionId],
                            candidate.canonicalTransactionId
                        );

                        return true;
                    },
                    effect => Db.transaction(effect)
                ),
                consolidateExistingTransferChainReclaim: Effect.fn(
                    'ConsolidationRepairExecutorService.consolidateExistingTransferChainReclaim'
                )(
                    function* (candidate: ExistingTransferChainReclaimCandidateInterface) {
                        const bridgeSourceIds = [candidate.bridgeIncomeTransactionId, candidate.bridgeExpenseTransactionId];
                        const eligible = yield* consolidationEligibilityService.findEligibleExistingTransferConsolidation(
                            bridgeSourceIds,
                            candidate.existingTransferId
                        );

                        if (!isDefined(eligible)) {
                            return false;
                        }

                        const { existingTransfer, sourceTransactions: bridgeSources } = eligible;

                        if (hasChainReclaimConsistentLedger(candidate, existingTransfer)) {
                            yield* consolidationMutationService.createMissingTransferFeeEntries(
                                existingTransfer.entries,
                                bridgeSources,
                                candidate.existingTransferId
                            );
                            yield* transactionConsolidationRepository.setConsolidationType(
                                candidate.existingTransferId,
                                TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER
                            );
                            yield* consolidationMutationService.moveSourcesToCanonical(bridgeSourceIds, candidate.existingTransferId);

                            return true;
                        }

                        yield* consolidationMutationService.createCanonicalTransferWithFeesAndMove(
                            buildIbanBridgeChainCanonicalInput({
                                title: existingTransfer.title,
                                operatedAt: candidate.operatedAt,
                                fromAccountId: candidate.sourceAccountId,
                                toAccountId: candidate.targetAccountId,
                                fromAmount: candidate.sourceAmount,
                                toAmount: candidate.targetAmount,
                                exchangeRate: candidate.exchangeRate,
                                fromEntryToIban: candidate.targetAccountIban
                            }),
                            [...bridgeSourceIds, candidate.existingTransferId],
                            [...bridgeSources, existingTransfer]
                        );

                        return true;
                    },
                    effect => Db.transaction(effect)
                ),
                consolidateExistingTransferIncomeDuplicate: Effect.fn(
                    'ConsolidationRepairExecutorService.consolidateExistingTransferIncomeDuplicate'
                )(
                    function* (candidate: ExistingTransferIncomeDuplicateCandidateInterface) {
                        const eligible = yield* consolidationEligibilityService.findEligibleExistingTransferConsolidation(
                            [candidate.duplicateTransactionId],
                            candidate.existingTransferId
                        );

                        if (!isDefined(eligible)) {
                            return false;
                        }

                        const { existingTransfer, sourceTransactions: duplicateSources } = eligible;

                        yield* consolidationMutationService.createCanonicalTransferWithFeesAndMove(
                            {
                                title: isNotEmptyString(existingTransfer.title)
                                    ? existingTransfer.title
                                    : (candidate.duplicateTransactionTitle ?? ''),
                                operatedAt: Math.floor(existingTransfer.operatedAt.getTime() / millisecondsInSecond),
                                fromAccountId: candidate.sourceAccountId,
                                toAccountId: candidate.targetAccountId,
                                fromAmount: candidate.sourceAmount,
                                toAmount: candidate.amount,
                                exchangeRate: candidate.exchangeRate,
                                consolidationType: TransactionConsolidationTypeEnum.TRANSFER_PAIR,
                                fromEntryExchangeRate: candidate.exchangeRate,
                                toEntryExchangeRate: 1,
                                fromEntryToIban:
                                    existingTransfer.entries.find(entry => entry.accountId === candidate.sourceAccountId)?.toIban ?? null
                            },
                            [candidate.existingTransferId, candidate.duplicateTransactionId],
                            [existingTransfer, ...duplicateSources]
                        );

                        return true;
                    },
                    effect => Db.transaction(effect)
                ),
                consolidateManualExpenseDuplicate: Effect.fn('ConsolidationRepairExecutorService.consolidateManualExpenseDuplicate')(
                    function* (candidate: ManualExpenseDuplicateCandidateInterface) {
                        const pairIds = [candidate.syncedTransactionId, candidate.manualTransactionId];
                        const transactions = yield* consolidationEligibilityService.findEligibleSourceTransactions(pairIds, pairIds);
                        const syncedTransaction = findById(transactions, candidate.syncedTransactionId);
                        const manualTransaction = findById(transactions, candidate.manualTransactionId);
                        const isManualDuplicateMergeAllowed = (consolidationType: TransactionConsolidationTypeEnum | null): boolean =>
                            !isDefined(consolidationType) ||
                            (consolidationType === TransactionConsolidationTypeEnum.MANUAL_EXPENSE_DUPLICATE &&
                                isDefined(manualTransaction) &&
                                isCaptureManualSource(manualTransaction.externalSource));

                        if (
                            !isDefined(syncedTransaction) ||
                            !isDefined(manualTransaction) ||
                            !isManualDuplicateMergeAllowed(syncedTransaction.consolidationType) ||
                            !isManualDuplicateMergeAllowed(manualTransaction.consolidationType)
                        ) {
                            return false;
                        }

                        yield* transactionConsolidationRepository.setConsolidationType(
                            candidate.syncedTransactionId,
                            TransactionConsolidationTypeEnum.MANUAL_EXPENSE_DUPLICATE
                        );
                        yield* consolidationMutationService.copyManualExpenseDuplicateUserData(syncedTransaction, manualTransaction);
                        yield* consolidationMutationService.moveSourcesToCanonical(
                            [candidate.manualTransactionId],
                            candidate.syncedTransactionId
                        );
                        yield* debtEventRepository.moveToTransaction(
                            candidate.manualTransactionId,
                            candidate.syncedTransactionId,
                            manualTransaction.entries.find(entry => entry.type !== TransactionEntryTypeEnum.FEE)?.id ?? null
                        );
                        yield* transactionReceiptRepository.moveToTransaction(candidate.manualTransactionId, candidate.syncedTransactionId);

                        return true;
                    },
                    effect => Db.transaction(effect)
                ),
                consolidateRefund: Effect.fn('ConsolidationRepairExecutorService.consolidateRefund')(
                    function* (candidate: RefundCandidateInterface) {
                        if (!(yield* hasFreshRefundCapacity(candidate))) {
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
            UnconsolidationService.layer,
            DebtEventRepository.layer,
            TransactionReceiptRepository.layer
        ])
    );
}
