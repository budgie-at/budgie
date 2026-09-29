import type { TransactionEntryRepository, TransactionRepository, TransactionTagsRepository } from '@budgie/contracts';

export interface UnconsolidationDependenciesInterface {
    readonly transactionEntryRepository: TransactionEntryRepository;
    readonly transactionRepository: TransactionRepository;
    readonly transactionTagsRepository: TransactionTagsRepository;
}
