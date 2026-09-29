import { CategorySourceEnum, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { P2pFiatDirectionEnum } from '../../auto/enum/p2p-fiat-direction.enum';
import { consolidationCopySourceTransactionTags } from '../../shared/utils/consolidation-copy-source-transaction-tags.util';

import type { P2pFiatTransferCandidateInterface } from '../../auto/interface/p2p-fiat-transfer-candidate.interface';
import type { CanonicalTransferInputInterface } from '../interface/canonical-transfer-input.interface';
import type { ConsolidationExecutorDependenciesInterface } from '../interface/consolidation-executor-dependencies.interface';
import type {
    AtmCashWithdrawalCandidateInterface,
    TransactionEntryEntityInterface,
    TransactionWithEntriesEntityInterface
} from '@budgie/contracts';

export class ConsolidationMutationService {
    readonly createCanonicalTransfer = Effect.fn('ConsolidationMutationService.createCanonicalTransfer')(function* (
        this: ConsolidationMutationService,
        input: CanonicalTransferInputInterface
    ) {
        const canonicalTransaction = yield* this.dependencies.transactionRepository.create({
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
        });

        yield* this.dependencies.transactionEntryRepository.bulkCreate([
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
        ]);

        return canonicalTransaction;
    });

    readonly createAtmCashWithdrawalFeeEntry = Effect.fn('ConsolidationMutationService.createAtmCashWithdrawalFeeEntry')(function* (
        this: ConsolidationMutationService,
        candidate: AtmCashWithdrawalCandidateInterface,
        sourceTransactions: TransactionWithEntriesEntityInterface[],
        canonicalTransactionId: number
    ) {
        const feeEntry = this.findFeeEntries(candidate.sourceAccountId, sourceTransactions).at(0);

        if (!isDefined(feeEntry)) {
            return;
        }

        yield* this.createCanonicalFeeEntries(candidate.sourceAccountId, [feeEntry], canonicalTransactionId);
    });

    readonly createP2pFiatTransferFeeEntries = Effect.fn('ConsolidationMutationService.createP2pFiatTransferFeeEntries')(function* (
        this: ConsolidationMutationService,
        candidate: P2pFiatTransferCandidateInterface,
        sourceTransactions: TransactionWithEntriesEntityInterface[],
        canonicalTransactionId: number
    ) {
        const bankAccountId = candidate.direction === P2pFiatDirectionEnum.BUY ? candidate.fromAccountId : candidate.toAccountId;
        const feeEntries = this.findFeeEntries(bankAccountId, sourceTransactions).filter(entry =>
            candidate.bankTransactionIds.includes(entry.transactionId)
        );

        if (!isNotEmptyArray(feeEntries)) {
            return;
        }

        yield* this.createCanonicalFeeEntries(bankAccountId, feeEntries, canonicalTransactionId);
    });

    readonly moveSourcesToCanonical = Effect.fn('ConsolidationMutationService.moveSourcesToCanonical')(function* (
        this: ConsolidationMutationService,
        sourceTransactionIds: number[],
        canonicalTransactionId: number
    ) {
        yield* this.dependencies.transactionEntryRepository.moveToConsolidatedTransaction(sourceTransactionIds, canonicalTransactionId);
        yield* this.dependencies.transactionRepository.setConsolidationParent(sourceTransactionIds, canonicalTransactionId);
    });

    readonly copySourceTags = Effect.fn('ConsolidationMutationService.copySourceTags')(function* (
        this: ConsolidationMutationService,
        sourceTransactionIds: number[],
        canonicalTransactionId: number
    ) {
        yield* consolidationCopySourceTransactionTags(
            this.dependencies.transactionTagsRepository,
            sourceTransactionIds,
            canonicalTransactionId
        );
    });

    private readonly createCanonicalFeeEntries = Effect.fnUntraced(function* (
        this: ConsolidationMutationService,
        accountId: number,
        feeEntries: TransactionEntryEntityInterface[],
        canonicalTransactionId: number
    ) {
        yield* this.dependencies.transactionEntryRepository.bulkCreate(
            feeEntries.map(feeEntry => ({
                transactionId: canonicalTransactionId,
                accountId,
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
            }))
        );
    });

    constructor(private readonly dependencies: ConsolidationExecutorDependenciesInterface) {}

    private findFeeEntries(
        accountId: number,
        sourceTransactions: TransactionWithEntriesEntityInterface[]
    ): TransactionEntryEntityInterface[] {
        return sourceTransactions
            .flatMap(transaction => transaction.entries)
            .filter(
                entry =>
                    entry.accountId === accountId &&
                    (entry.type === TransactionEntryTypeEnum.FEE || entry.categorySource === CategorySourceEnum.FEE) &&
                    isPositiveNumber(entry.amount)
            );
    }
}
