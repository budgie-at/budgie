import { AccountRepository, BankIntegrationRepository, InstrumentRepository, SyncRepository } from '@budgie/contracts';
import { AccountBalanceIncrementalService, AccountService, TransactionImportService, TransactionService } from '@budgie/ledger';
import * as Layer from 'effect/Layer';

export const fileSyncDependenciesLayer = Layer.mergeAll(
    AccountRepository.layer,
    BankIntegrationRepository.layer,
    InstrumentRepository.layer,
    SyncRepository.layer,
    AccountService.layer,
    AccountBalanceIncrementalService.layer,
    TransactionImportService.layer,
    TransactionService.layer
);
