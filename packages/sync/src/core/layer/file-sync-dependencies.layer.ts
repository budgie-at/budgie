import { AccountRepository, BankIntegrationRepository, InstrumentRepository, SyncRepository } from '@budgie/contracts';
import { AccountBalanceIncrementalService, AccountService, TransactionImportService, TransactionService } from '@budgie/ledger';
import { RuleEngineService } from '@budgie/rules';
import * as Layer from 'effect/Layer';

import { AccountReissueMergeService } from '../service/account-reissue-merge.service';
import { SyncOperationMetadataService } from '../service/sync-operation-metadata.service';

export const fileSyncDependenciesLayer = Layer.mergeAll(
    AccountRepository.layer,
    BankIntegrationRepository.layer,
    InstrumentRepository.layer,
    SyncRepository.layer,
    AccountService.layer,
    AccountBalanceIncrementalService.layer,
    TransactionImportService.layer,
    TransactionService.layer,
    SyncOperationMetadataService.layer,
    RuleEngineService.layer,
    AccountReissueMergeService.layer
);
