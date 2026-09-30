import { AccountTypeEnum } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { ConsolidationExecutorService } from '../../executor/service/consolidation-executor.service';
import { ConsolidationRepairExecutorService } from '../../executor/service/consolidation-repair-executor.service';
import { TransferPairRepository } from '../../query/repository/transfer-pair.repository';
import { CONSOLIDATION_YIELD } from '../../shared/constant/consolidation-yield.constant';
import { TRANSFER_PAIR_P2P_FIAT_RATE_TOLERANCE } from '../../shared/constant/transfer-pair-p2p-fiat.constant';
import { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';
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
            const transferPairRepository = yield* TransferPairRepository;
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

                const sortedCandidates = candidates.slice().sort((left, right) => compareCandidates(left, right));
                const [bestCandidate, secondCandidate] = sortedCandidates;

                if (isDefined(secondCandidate) && compareCandidates(bestCandidate, secondCandidate) === 0) {
                    return null;
                }

                return bestCandidate;
            };

            const groupCandidatesByBankTransaction = (
                candidates: P2pFiatTransferCandidateInterface[]
            ): Map<number, P2pFiatTransferCandidateInterface[]> => {
                const groupedCandidates = new Map<number, P2pFiatTransferCandidateInterface[]>();

                for (const candidate of candidates) {
                    for (const bankTransactionId of candidate.bankTransactionIds) {
                        const group = groupedCandidates.get(bankTransactionId);

                        if (isDefined(group)) {
                            group.push(candidate);
                        } else {
                            groupedCandidates.set(bankTransactionId, [candidate]);
                        }
                    }
                }

                return groupedCandidates;
            };

            const groupCandidatesByP2pTransaction = (
                candidates: P2pFiatTransferCandidateInterface[]
            ): Map<number, P2pFiatTransferCandidateInterface[]> => {
                const groupedCandidates = new Map<number, P2pFiatTransferCandidateInterface[]>();

                for (const candidate of candidates) {
                    const group = groupedCandidates.get(candidate.p2pTransactionId);

                    if (isDefined(group)) {
                        group.push(candidate);
                    } else {
                        groupedCandidates.set(candidate.p2pTransactionId, [candidate]);
                    }
                }

                return groupedCandidates;
            };

            const selectCandidates = (candidates: P2pFiatTransferCandidateInterface[]): P2pFiatTransferCandidateInterface[] => {
                const preferredCandidates = [...groupCandidatesByP2pTransaction(candidates).values()]
                    .map(group => findUniqueBestCandidate(group))
                    .filter(isDefined);
                const candidatesByBankTransaction = groupCandidatesByBankTransaction(preferredCandidates);

                return preferredCandidates.filter(candidate =>
                    candidate.bankTransactionIds.every(bankTransactionId => {
                        const owners = candidatesByBankTransaction.get(bankTransactionId) ?? [];

                        return findUniqueBestCandidate(owners) === candidate;
                    })
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

            const buildBuyCandidates = (rows: P2pFiatAtomicCandidateInterface[]): P2pFiatTransferCandidateInterface[] => {
                const groupedRows = new Map<string, P2pFiatAtomicCandidateInterface[]>();

                for (const row of rows) {
                    if (row.incomeAccountType === AccountTypeEnum.CRYPTO_SYNC) {
                        const groupKey = `${row.incomeTransactionId}:${row.expenseEntryAccountId}`;
                        const group = groupedRows.get(groupKey);

                        if (isDefined(group)) {
                            group.push(row);
                        } else {
                            groupedRows.set(groupKey, [row]);
                        }
                    }
                }

                return [...groupedRows.values()]
                    .flatMap(group => buildExpenseCombinations(group))
                    .map(combination => buildBuyCandidate(combination))
                    .filter(isDefined);
            };

            const buildAuthoritativeCandidates = (rows: P2pFiatAuthoritativeCandidateInterface[]): P2pFiatTransferCandidateInterface[] =>
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
                const authoritativeRows = yield* transferPairRepository.findP2pFiatAuthoritativeCandidates(scope);
                const authoritativeCandidates = selectCandidates(buildAuthoritativeCandidates(authoritativeRows));

                if (isNotEmptyArray(authoritativeCandidates)) {
                    return authoritativeCandidates;
                }

                const reservedTransactionIds = new Set(
                    authoritativeRows.flatMap(row => [row.expenseTransactionId, row.incomeTransactionId])
                );
                const rows = yield* transferPairRepository.findP2pFiatAtomicCandidates(scope);
                const unreservedRows = rows.filter(
                    row => !reservedTransactionIds.has(row.expenseTransactionId) && !reservedTransactionIds.has(row.incomeTransactionId)
                );
                const candidates = [...buildBuyCandidates(unreservedRows), ...buildSellCandidates(unreservedRows)];

                return selectCandidates(candidates);
            });

            return makeConsolidationFamilyStrategy<P2pFiatTransferCandidateInterface>({
                key: ConsolidationFamilyKeyEnum.P2P_FIAT_TRANSFER,
                findCandidates,
                consolidateCandidate: candidate => consolidationExecutorService.consolidateP2pFiatTransfer(candidate),
                getSourceTransactionIds: candidate => [...candidate.sourceTransactionIds],
                prepareProcess: Effect.fn('P2pFiatTransferConsolidationFamilyService.prepareProcess')(function* (
                    context: ConsolidationFamilyRunContextInterface
                ) {
                    const repairCandidates = yield* transferPairRepository.findP2pFiatAuthoritativeRepairCandidates(context.scope);

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
        Layer.provide([TransferPairRepository.layer, ConsolidationExecutorService.layer, ConsolidationRepairExecutorService.layer])
    );
}
