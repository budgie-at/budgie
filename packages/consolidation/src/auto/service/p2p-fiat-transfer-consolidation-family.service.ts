import { AccountTypeEnum } from '@budgie/contracts';
import * as Arr from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { ConsolidationExecutorService } from '../../executor/service/consolidation-executor.service';
import { ConsolidationRepairExecutorService } from '../../executor/service/consolidation-repair-executor.service';
import { ConsolidationCandidateRepository } from '../../query/repository/consolidation-candidate.repository';
import { CONSOLIDATION_YIELD } from '../../shared/constant/consolidation-yield.constant';
import { TRANSFER_PAIR_P2P_FIAT_RATE_TOLERANCE } from '../../shared/constant/transfer-pair-p2p-fiat.constant';
import { P2pFiatDirectionEnum } from '../enum/p2p-fiat-direction.enum';
import { makeConsolidationFamilyStrategy } from '../utils/make-consolidation-family-strategy.util';

import type { P2pFiatAtomicCandidateInterface } from '../../query/interface/p2p-fiat-atomic-candidate.interface';
import type { P2pFiatAuthoritativeCandidateInterface } from '../../query/interface/p2p-fiat-authoritative-candidate.interface';
import type { ConsolidationFamilyRunContextInterface } from '../interface/consolidation-family-run-context.interface';
import type { P2pFiatTransferCandidateInterface } from '../interface/p2p-fiat-transfer-candidate.interface';
import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

export class P2pFiatTransferConsolidationFamilyService extends Context.Service<P2pFiatTransferConsolidationFamilyService>()(
    '@budgie/consolidation/P2pFiatTransferConsolidationFamilyService',
    {
        make: Effect.gen(function* () {
            const consolidationCandidateRepository = yield* ConsolidationCandidateRepository;
            const consolidationExecutorService = yield* ConsolidationExecutorService;
            const consolidationRepairExecutorService = yield* ConsolidationRepairExecutorService;
            const maxBankExpenseCount = 3;

            const computeRateDifference = (impliedExchangeRate: number, expectedExchangeRate: number): number =>
                Math.abs(impliedExchangeRate - expectedExchangeRate) / expectedExchangeRate;

            const compareCandidates = (left: P2pFiatTransferCandidateInterface, right: P2pFiatTransferCandidateInterface): number =>
                left.rateDifference - right.rateDifference ||
                left.maximumTimeDifference - right.maximumTimeDifference ||
                left.bankTransactionIds.length - right.bankTransactionIds.length;

            const findUniqueBestCandidate = (candidates: P2pFiatTransferCandidateInterface[]): P2pFiatTransferCandidateInterface | null => {
                if (!isNotEmptyArray(candidates)) {
                    return null;
                }

                const sortedCandidates = [...candidates].sort((left, right) => compareCandidates(left, right));
                const [bestCandidate, secondCandidate] = sortedCandidates;

                if (isDefined(secondCandidate) && compareCandidates(bestCandidate, secondCandidate) === 0) {
                    return null;
                }

                return bestCandidate;
            };

            const selectCandidates = (candidates: P2pFiatTransferCandidateInterface[]): P2pFiatTransferCandidateInterface[] => {
                const preferredCandidates = Object.values(Arr.groupBy(candidates, candidate => String(candidate.p2pTransactionId)))
                    .map(group => findUniqueBestCandidate(group))
                    .filter(isDefined);
                const ownersByBankTransaction = Arr.groupBy(
                    preferredCandidates.flatMap(candidate =>
                        candidate.bankTransactionIds.map(bankTransactionId => ({ bankTransactionId, candidate }))
                    ),
                    owner => String(owner.bankTransactionId)
                );

                return preferredCandidates.filter(candidate =>
                    candidate.bankTransactionIds.every(
                        bankTransactionId =>
                            findUniqueBestCandidate(
                                (ownersByBankTransaction[String(bankTransactionId)] ?? []).map(owner => owner.candidate)
                            ) === candidate
                    )
                );
            };

            const getNextExpenseIndex = (
                rows: P2pFiatAtomicCandidateInterface[],
                currentRows: P2pFiatAtomicCandidateInterface[]
            ): number => {
                const lastRow = currentRows.at(-1);

                return isDefined(lastRow) ? rows.indexOf(lastRow) + 1 : 0;
            };

            const collectExpenseCombinations = (
                rows: P2pFiatAtomicCandidateInterface[],
                currentRows: P2pFiatAtomicCandidateInterface[],
                combinations: P2pFiatAtomicCandidateInterface[][],
                maximumAcceptedBankAmount: number
            ): void => {
                if (isNotEmptyArray(currentRows)) {
                    combinations.push([...currentRows]);
                }

                if (currentRows.length === maxBankExpenseCount) {
                    return;
                }

                const startIndex = getNextExpenseIndex(rows, currentRows);
                const currentAmount = currentRows.reduce((total, row) => total + row.expenseEntryAmount, 0);

                for (let rowIndex = startIndex; rowIndex < rows.length; rowIndex += 1) {
                    const row = rows.at(rowIndex);

                    if (isDefined(row) && currentAmount + row.expenseEntryAmount <= maximumAcceptedBankAmount) {
                        currentRows.push(row);
                        collectExpenseCombinations(rows, currentRows, combinations, maximumAcceptedBankAmount);
                        currentRows.pop();
                    }
                }
            };

            const buildExpenseCombinations = (rows: P2pFiatAtomicCandidateInterface[]): P2pFiatAtomicCandidateInterface[][] => {
                if (!isNotEmptyArray(rows)) {
                    return [];
                }

                const [representativeRow] = rows;
                const maximumAcceptedBankAmount =
                    representativeRow.incomeEntryAmount /
                    (representativeRow.expectedExchangeRate * (1 - TRANSFER_PAIR_P2P_FIAT_RATE_TOLERANCE));
                const eligibleRows = rows.filter(row => row.expenseEntryAmount <= maximumAcceptedBankAmount);
                const combinations: P2pFiatAtomicCandidateInterface[][] = [];

                collectExpenseCombinations(eligibleRows, [], combinations, maximumAcceptedBankAmount);

                return combinations;
            };

            const buildSellCandidate = (
                row: P2pFiatAtomicCandidateInterface,
                isAuthoritative = false
            ): P2pFiatTransferCandidateInterface | null => {
                const rateDifference = computeRateDifference(row.incomeEntryAmount / row.expenseEntryAmount, row.expectedExchangeRate);

                if (!isAuthoritative && rateDifference > TRANSFER_PAIR_P2P_FIAT_RATE_TOLERANCE) {
                    return null;
                }

                return {
                    sourceTransactionIds: [row.expenseTransactionId, row.incomeTransactionId],
                    bankTransactionIds: [row.incomeTransactionId],
                    p2pTransactionId: row.expenseTransactionId,
                    direction: P2pFiatDirectionEnum.SELL,
                    assetCode: row.expenseCurrency,
                    operatedAt: row.expenseOperatedAt,
                    fromAccountId: row.expenseEntryAccountId,
                    toAccountId: row.incomeEntryAccountId,
                    fromAmount: row.expenseEntryAmount,
                    toAmount: row.incomeEntryAmount,
                    fromEntryExchangeRate: row.expenseEntryExchangeRate,
                    toEntryExchangeRate: row.incomeEntryExchangeRate,
                    fromEntryToIban: row.expenseEntryToIban,
                    rateDifference,
                    maximumTimeDifference: row.timeDiff
                };
            };

            const buildBuyCandidate = (
                combination: P2pFiatAtomicCandidateInterface[],
                isAuthoritative = false
            ): P2pFiatTransferCandidateInterface | null => {
                if (!isNotEmptyArray(combination)) {
                    return null;
                }

                const [representativeRow] = combination;
                const bankTransactionIds = combination.map(row => row.expenseTransactionId).sort((left, right) => left - right);

                if (new Set(bankTransactionIds).size !== bankTransactionIds.length) {
                    return null;
                }

                const fromAmount = combination.reduce((total, row) => total + row.expenseEntryAmount, 0);
                const rateDifference = computeRateDifference(
                    representativeRow.incomeEntryAmount / fromAmount,
                    representativeRow.expectedExchangeRate
                );

                if (!isAuthoritative && rateDifference > TRANSFER_PAIR_P2P_FIAT_RATE_TOLERANCE) {
                    return null;
                }

                return {
                    sourceTransactionIds: [...bankTransactionIds, representativeRow.incomeTransactionId],
                    bankTransactionIds,
                    p2pTransactionId: representativeRow.incomeTransactionId,
                    direction: P2pFiatDirectionEnum.BUY,
                    assetCode: representativeRow.incomeCurrency,
                    operatedAt: Math.min(...combination.map(row => row.expenseOperatedAt)),
                    fromAccountId: representativeRow.expenseEntryAccountId,
                    toAccountId: representativeRow.incomeEntryAccountId,
                    fromAmount,
                    toAmount: representativeRow.incomeEntryAmount,
                    fromEntryExchangeRate: representativeRow.expenseEntryExchangeRate,
                    toEntryExchangeRate: representativeRow.incomeEntryExchangeRate,
                    fromEntryToIban: representativeRow.expenseEntryToIban,
                    rateDifference,
                    maximumTimeDifference: Math.max(...combination.map(row => row.timeDiff))
                };
            };

            const buildSellCandidates = (rows: P2pFiatAtomicCandidateInterface[]): P2pFiatTransferCandidateInterface[] =>
                rows
                    .filter(row => row.expenseAccountType === AccountTypeEnum.CRYPTO_SYNC)
                    .map(row => buildSellCandidate(row))
                    .filter(isDefined);

            const buildBuyCandidates = (rows: P2pFiatAtomicCandidateInterface[]): P2pFiatTransferCandidateInterface[] =>
                Object.values(
                    Arr.groupBy(
                        rows.filter(row => row.incomeAccountType === AccountTypeEnum.CRYPTO_SYNC),
                        row => `${row.incomeTransactionId}:${row.expenseEntryAccountId}`
                    )
                )
                    .flatMap(group => buildExpenseCombinations(group))
                    .map(combination => buildBuyCandidate(combination))
                    .filter(isDefined);

            const buildAuthoritativeCandidates = (
                rows: readonly P2pFiatAuthoritativeCandidateInterface[]
            ): P2pFiatTransferCandidateInterface[] =>
                rows
                    .map(row => {
                        const candidate =
                            row.incomeAccountType === AccountTypeEnum.CRYPTO_SYNC
                                ? buildBuyCandidate([row], true)
                                : buildSellCandidate(row, true);

                        return isDefined(candidate) ? { ...candidate, rateDifference: row.quoteDelta / row.quotedAmount } : null;
                    })
                    .filter(isDefined);

            const findCandidates = Effect.fn('P2pFiatTransferConsolidationFamilyService.findCandidates')(function* (
                scope: ConsolidationScanScopeInterface | null
            ) {
                const authoritativeRows = yield* consolidationCandidateRepository.findP2pFiatAuthoritativeCandidates(scope);
                const authoritativeCandidates = selectCandidates(buildAuthoritativeCandidates(authoritativeRows));

                if (isNotEmptyArray(authoritativeCandidates)) {
                    return authoritativeCandidates;
                }

                const reservedTransactionIds = new Set(
                    authoritativeRows.flatMap(row => [row.expenseTransactionId, row.incomeTransactionId])
                );
                const rows = yield* consolidationCandidateRepository.findP2pFiatAtomicCandidates(scope);
                const unreservedRows = rows.filter(
                    row => !reservedTransactionIds.has(row.expenseTransactionId) && !reservedTransactionIds.has(row.incomeTransactionId)
                );
                const candidates = [...buildBuyCandidates(unreservedRows), ...buildSellCandidates(unreservedRows)];

                return selectCandidates(candidates);
            });

            return makeConsolidationFamilyStrategy<P2pFiatTransferCandidateInterface>({
                findCandidates,
                consolidateCandidate: candidate => consolidationExecutorService.consolidateP2pFiatTransfer(candidate),
                getSourceTransactionIds: candidate => [...candidate.sourceTransactionIds],
                prepareProcess: Effect.fn('P2pFiatTransferConsolidationFamilyService.prepareProcess')(function* (
                    context: ConsolidationFamilyRunContextInterface
                ) {
                    const repairCandidates = yield* consolidationCandidateRepository.findP2pFiatAuthoritativeRepairCandidates(
                        context.scope
                    );

                    for (const candidate of repairCandidates) {
                        yield* consolidationRepairExecutorService.repairP2pFiatCanonical(candidate.canonicalTransactionId);
                        yield* CONSOLIDATION_YIELD;
                    }
                }),
                shouldRepeatAfterSuccessfulPass: true
            });
        })
    }
) {
    static readonly layer = Layer.effect(P2pFiatTransferConsolidationFamilyService, P2pFiatTransferConsolidationFamilyService.make).pipe(
        Layer.provide([
            ConsolidationCandidateRepository.layer,
            ConsolidationExecutorService.layer,
            ConsolidationRepairExecutorService.layer
        ])
    );
}
