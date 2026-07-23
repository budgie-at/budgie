import { AccountTypeEnum } from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { TRANSFER_PAIR_P2P_FIAT_RATE_TOLERANCE } from '../../shared/constant/transfer-pair-p2p-fiat.constant';
import { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';
import { P2pFiatDirectionEnum } from '../enum/p2p-fiat-direction.enum';

import { ConsolidationFamilyStrategyService } from './consolidation-family-strategy.service';

import type { ConsolidationExecutorService } from '../../executor/service/consolidation-executor.service';
import type { P2pFiatAtomicCandidateInterface } from '../../query/interface/p2p-fiat-atomic-candidate.interface';
import type { TransferPairRepository } from '../../query/repository/transfer-pair.repository';
import type { P2pFiatTransferCandidateInterface } from '../interface/p2p-fiat-transfer-candidate.interface';
import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

export class P2pFiatTransferConsolidationFamilyService extends ConsolidationFamilyStrategyService<P2pFiatTransferCandidateInterface> {
    private static readonly MAX_BANK_EXPENSE_COUNT = 3;

    readonly key = ConsolidationFamilyKeyEnum.P2P_FIAT_TRANSFER;

    constructor(
        private readonly transferPairRepository: Pick<TransferPairRepository, 'findP2pFiatAtomicCandidates'>,
        private readonly consolidationExecutorService: Pick<ConsolidationExecutorService, 'consolidateP2pFiatTransfer'>,
        yieldControl: () => Promise<void>
    ) {
        super(yieldControl);
    }

    protected async findCandidates(scope: ConsolidationScanScopeInterface | null): Promise<P2pFiatTransferCandidateInterface[]> {
        const rows = await this.transferPairRepository.findP2pFiatAtomicCandidates(scope);
        const candidates = [...this.buildBuyCandidates(rows), ...this.buildSellCandidates(rows)];

        return this.selectCandidates(candidates);
    }

    protected consolidateCandidate(candidate: P2pFiatTransferCandidateInterface): Promise<boolean> {
        return this.consolidationExecutorService.consolidateP2pFiatTransfer(candidate);
    }

    protected getSourceTransactionIds(candidate: P2pFiatTransferCandidateInterface): number[] {
        return [...candidate.sourceTransactionIds];
    }

    protected override shouldRepeatAfterSuccessfulPass(): boolean {
        return true;
    }

    private buildBuyCandidates(rows: P2pFiatAtomicCandidateInterface[]): P2pFiatTransferCandidateInterface[] {
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
            .flatMap(group => this.buildExpenseCombinations(group))
            .map(combination => this.buildBuyCandidate(combination))
            .filter(isDefined);
    }

    private buildSellCandidates(rows: P2pFiatAtomicCandidateInterface[]): P2pFiatTransferCandidateInterface[] {
        return rows
            .filter(row => row.expenseAccountType === AccountTypeEnum.CRYPTO_SYNC)
            .map(row => this.buildSellCandidate(row))
            .filter(isDefined);
    }

    private buildExpenseCombinations(rows: P2pFiatAtomicCandidateInterface[]): P2pFiatAtomicCandidateInterface[][] {
        if (!isNotEmptyArray(rows)) {
            return [];
        }

        const [representativeRow] = rows;
        const maximumAcceptedBankAmount =
            representativeRow.incomeEntryAmount / (representativeRow.expectedExchangeRate * (1 - TRANSFER_PAIR_P2P_FIAT_RATE_TOLERANCE));
        const eligibleRows = rows.filter(row => row.expenseEntryAmount <= maximumAcceptedBankAmount);
        const combinations: P2pFiatAtomicCandidateInterface[][] = [];

        this.collectExpenseCombinations(eligibleRows, [], combinations, maximumAcceptedBankAmount);

        return combinations;
    }

    private collectExpenseCombinations(
        rows: P2pFiatAtomicCandidateInterface[],
        currentRows: P2pFiatAtomicCandidateInterface[],
        combinations: P2pFiatAtomicCandidateInterface[][],
        maximumAcceptedBankAmount: number
    ): void {
        if (isNotEmptyArray(currentRows)) {
            combinations.push([...currentRows]);
        }

        if (currentRows.length === P2pFiatTransferConsolidationFamilyService.MAX_BANK_EXPENSE_COUNT) {
            return;
        }

        const startIndex = this.getNextExpenseIndex(rows, currentRows);
        const currentAmount = currentRows.reduce((total, row) => total + row.expenseEntryAmount, 0);

        for (let rowIndex = startIndex; rowIndex < rows.length; rowIndex += 1) {
            const row = rows.at(rowIndex);

            if (isDefined(row) && currentAmount + row.expenseEntryAmount <= maximumAcceptedBankAmount) {
                currentRows.push(row);
                this.collectExpenseCombinations(rows, currentRows, combinations, maximumAcceptedBankAmount);
                currentRows.pop();
            }
        }
    }

    private getNextExpenseIndex(rows: P2pFiatAtomicCandidateInterface[], currentRows: P2pFiatAtomicCandidateInterface[]): number {
        const lastRow = currentRows.at(-1);

        return isDefined(lastRow) ? rows.indexOf(lastRow) + 1 : 0;
    }

    private buildBuyCandidate(combination: P2pFiatAtomicCandidateInterface[]): P2pFiatTransferCandidateInterface | null {
        if (!isNotEmptyArray(combination)) {
            return null;
        }

        const [representativeRow] = combination;
        const fromAmount = combination.reduce((total, row) => total + row.expenseEntryAmount, 0);
        const rateDifference = this.computeRateDifference(
            representativeRow.incomeEntryAmount / fromAmount,
            representativeRow.expectedExchangeRate
        );

        if (rateDifference > TRANSFER_PAIR_P2P_FIAT_RATE_TOLERANCE) {
            return null;
        }

        const bankTransactionIds = combination.map(row => row.expenseTransactionId).sort((left, right) => left - right);

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
    }

    private buildSellCandidate(row: P2pFiatAtomicCandidateInterface): P2pFiatTransferCandidateInterface | null {
        const rateDifference = this.computeRateDifference(row.incomeEntryAmount / row.expenseEntryAmount, row.expectedExchangeRate);

        if (rateDifference > TRANSFER_PAIR_P2P_FIAT_RATE_TOLERANCE) {
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
    }

    private selectCandidates(candidates: P2pFiatTransferCandidateInterface[]): P2pFiatTransferCandidateInterface[] {
        const preferredCandidates = [...this.groupCandidatesByP2pTransaction(candidates).values()]
            .map(group => this.findUniqueBestCandidate(group))
            .filter(isDefined);
        const candidatesByBankTransaction = this.groupCandidatesByBankTransaction(preferredCandidates);

        return preferredCandidates.filter(candidate =>
            candidate.bankTransactionIds.every(bankTransactionId => {
                const owners = candidatesByBankTransaction.get(bankTransactionId) ?? [];

                return this.findUniqueBestCandidate(owners) === candidate;
            })
        );
    }

    private groupCandidatesByP2pTransaction(
        candidates: P2pFiatTransferCandidateInterface[]
    ): Map<number, P2pFiatTransferCandidateInterface[]> {
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
    }

    private groupCandidatesByBankTransaction(
        candidates: P2pFiatTransferCandidateInterface[]
    ): Map<number, P2pFiatTransferCandidateInterface[]> {
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
    }

    private findUniqueBestCandidate(candidates: P2pFiatTransferCandidateInterface[]): P2pFiatTransferCandidateInterface | null {
        if (!isNotEmptyArray(candidates)) {
            return null;
        }

        const sortedCandidates = candidates.slice().sort((left, right) => this.compareCandidates(left, right));
        const [bestCandidate, secondCandidate] = sortedCandidates;

        if (isDefined(secondCandidate) && this.compareCandidates(bestCandidate, secondCandidate) === 0) {
            return null;
        }

        return bestCandidate;
    }

    private compareCandidates(left: P2pFiatTransferCandidateInterface, right: P2pFiatTransferCandidateInterface): number {
        return (
            left.rateDifference - right.rateDifference ||
            left.maximumTimeDifference - right.maximumTimeDifference ||
            left.bankTransactionIds.length - right.bankTransactionIds.length
        );
    }

    private computeRateDifference(impliedExchangeRate: number, expectedExchangeRate: number): number {
        return Math.abs(impliedExchangeRate - expectedExchangeRate) / expectedExchangeRate;
    }
}
