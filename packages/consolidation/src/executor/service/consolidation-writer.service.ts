import { CategorySourceEnum, TransactionConsolidationTypeEnum, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { consolidationCopySourceTransactionTags } from '../../shared/utils/consolidation-copy-source-transaction-tags.util';

import { ConsolidationEligibilityService } from './consolidation-eligibility.service';

import type { CanonicalTransferInputInterface } from '../interface/canonical-transfer-input.interface';
import type { ConsolidationExecutorDependenciesInterface } from '../interface/consolidation-executor-dependencies.interface';
import type {
    AtmCashWithdrawalCandidateInterface,
    DB,
    ExistingTransferChainReclaimCandidateInterface,
    ExistingTransferIncomeDuplicateCandidateInterface,
    IbanBridgeCanonicalDuplicateCandidateInterface,
    RefundCandidateInterface,
    TransactionEntityInterface,
    TransactionEntryEntityInterface,
    TransactionWithEntriesEntityInterface
} from '@budgie/contracts';

export class ConsolidationWriterService {
    private readonly consolidationEligibilityService: ConsolidationEligibilityService;

    constructor(private readonly dependencies: ConsolidationExecutorDependenciesInterface) {
        this.consolidationEligibilityService = new ConsolidationEligibilityService(dependencies);
    }

    async consolidateRefund(candidate: RefundCandidateInterface, tx: DB): Promise<boolean> {
        const sourceTransactionIds = [candidate.expenseTransactionId, ...candidate.refundIncomeTransactionIds];

        if (!(await this.consolidationEligibilityService.areCandidatesStillEligible(sourceTransactionIds, tx))) {
            return false;
        }

        await this.dependencies.transactionRepository.setConsolidationType(
            candidate.expenseTransactionId,
            TransactionConsolidationTypeEnum.REFUND,
            tx
        );
        await this.copySourceTags(candidate.refundIncomeTransactionIds, candidate.expenseTransactionId, tx);
        await this.moveSourcesToCanonical(candidate.refundIncomeTransactionIds, candidate.expenseTransactionId, tx);

        return true;
    }

    async consolidateIbanBridgeCanonicalDuplicate(candidate: IbanBridgeCanonicalDuplicateCandidateInterface, tx: DB): Promise<boolean> {
        const sourceTransactionIds = [candidate.expenseTransactionId, candidate.incomeTransactionId];

        if (!(await this.consolidationEligibilityService.areCandidatesStillEligible(sourceTransactionIds, tx))) {
            return false;
        }

        await this.moveSourcesToCanonical(sourceTransactionIds, candidate.existingCanonicalTransferId, tx);

        return true;
    }

    async consolidateExistingTransferChainReclaim(candidate: ExistingTransferChainReclaimCandidateInterface, tx: DB): Promise<boolean> {
        const sourceTransactionIds = [candidate.bridgeIncomeTransactionId, candidate.bridgeExpenseTransactionId];

        if (
            !(await this.consolidationEligibilityService.isExistingTransferConsolidationStillEligible(
                sourceTransactionIds,
                candidate.existingTransferId,
                tx
            ))
        ) {
            return false;
        }

        await this.dependencies.transactionRepository.setConsolidationType(
            candidate.existingTransferId,
            TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER,
            tx
        );
        await this.moveSourcesToCanonical(sourceTransactionIds, candidate.existingTransferId, tx);

        return true;
    }

    async consolidateExistingTransferIncomeDuplicate(
        candidate: ExistingTransferIncomeDuplicateCandidateInterface,
        tx: DB
    ): Promise<boolean> {
        const sourceTransactionIds = [candidate.incomeTransactionId];

        if (
            !(await this.consolidationEligibilityService.isExistingTransferConsolidationStillEligible(
                sourceTransactionIds,
                candidate.existingTransferId,
                tx
            ))
        ) {
            return false;
        }

        await this.dependencies.transactionRepository.updateById(
            candidate.existingTransferId,
            {
                exchangeRate: candidate.exchangeRate,
                toAccountId: candidate.targetAccountId
            },
            tx
        );
        await this.dependencies.transactionEntryRepository.updateById(
            candidate.existingTransferTargetEntryId,
            {
                accountId: candidate.targetAccountId,
                amount: candidate.amount,
                exchangeRate: 1
            },
            tx
        );
        await this.dependencies.transactionRepository.setConsolidationType(
            candidate.existingTransferId,
            TransactionConsolidationTypeEnum.TRANSFER_PAIR,
            tx
        );
        await this.moveSourcesToCanonical(sourceTransactionIds, candidate.existingTransferId, tx);

        return true;
    }

    async createCanonicalTransfer(input: CanonicalTransferInputInterface, tx: DB): Promise<TransactionEntityInterface> {
        const canonicalTransaction = await this.dependencies.transactionRepository.create(
            {
                type: TransactionTypeEnum.TRANSFER,
                title: input.title,
                externalId: null,
                operatedAt: new Date(input.operatedAt * 1000),
                comment: '',
                toAccountId: input.toAccountId,
                fromAccountId: input.fromAccountId,
                exchangeRate: input.exchangeRate,
                externalSource: null,
                needsEmbedding: false,
                consolidationType: input.consolidationType,
                consolidationParentTransactionId: null,
                updatedBy: null
            },
            tx
        );

        await this.dependencies.transactionEntryRepository.bulkCreate(
            [
                {
                    transactionId: canonicalTransaction.id,
                    accountId: input.fromAccountId,
                    categoryId: null,
                    mccCategoryId: null,
                    type: TransactionEntryTypeEnum.CREDIT,
                    amount: input.fromAmount,
                    externalId: null,
                    exchangeRate: input.fromEntryExchangeRate,
                    toIban: input.fromEntryToIban,
                    originalTransactionId: null
                },
                {
                    transactionId: canonicalTransaction.id,
                    accountId: input.toAccountId,
                    categoryId: null,
                    mccCategoryId: null,
                    type: TransactionEntryTypeEnum.DEBIT,
                    amount: input.toAmount,
                    externalId: null,
                    exchangeRate: input.toEntryExchangeRate,
                    toIban: null,
                    originalTransactionId: null
                }
            ],
            tx
        );

        return canonicalTransaction;
    }

    async createAtmCashWithdrawalFeeEntry(
        candidate: AtmCashWithdrawalCandidateInterface,
        sourceTransactions: TransactionWithEntriesEntityInterface[],
        canonicalTransactionId: number,
        tx: DB
    ): Promise<void> {
        const feeEntry = this.findAtmCashWithdrawalFeeEntry(candidate, sourceTransactions);

        if (!isDefined(feeEntry)) {
            return;
        }

        await this.dependencies.transactionEntryRepository.bulkCreate(
            [
                {
                    transactionId: canonicalTransactionId,
                    accountId: candidate.sourceAccountId,
                    categoryId: feeEntry.categoryId,
                    categorySource: feeEntry.categorySource,
                    mccCategoryId: feeEntry.mccCategoryId,
                    type: TransactionEntryTypeEnum.FEE,
                    amount: feeEntry.amount,
                    externalId: null,
                    exchangeRate: feeEntry.exchangeRate,
                    baseInstrumentId: feeEntry.baseInstrumentId,
                    baseExchangeRate: feeEntry.baseExchangeRate,
                    baseAmount: feeEntry.baseAmount,
                    toIban: null,
                    originalTransactionId: null
                }
            ],
            tx
        );
    }

    async moveSourcesToCanonical(sourceTransactionIds: number[], canonicalTransactionId: number, tx: DB): Promise<void> {
        await this.dependencies.transactionEntryRepository.moveToConsolidatedTransaction(sourceTransactionIds, canonicalTransactionId, tx);
        await this.dependencies.transactionRepository.setConsolidationParent(sourceTransactionIds, canonicalTransactionId, tx);
    }

    async copySourceTags(sourceTransactionIds: number[], canonicalTransactionId: number, tx: DB): Promise<void> {
        await consolidationCopySourceTransactionTags(
            this.dependencies.transactionTagsRepository,
            sourceTransactionIds,
            canonicalTransactionId,
            tx
        );
    }

    private findAtmCashWithdrawalFeeEntry(
        candidate: AtmCashWithdrawalCandidateInterface,
        sourceTransactions: TransactionWithEntriesEntityInterface[]
    ): TransactionEntryEntityInterface | undefined {
        return sourceTransactions
            .flatMap(transaction => transaction.entries)
            .find(
                entry =>
                    entry.accountId === candidate.sourceAccountId &&
                    (entry.type === TransactionEntryTypeEnum.FEE || entry.categorySource === CategorySourceEnum.FEE) &&
                    isPositiveNumber(entry.amount)
            );
    }
}
