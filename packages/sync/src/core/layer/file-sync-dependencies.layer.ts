import {
    AccountRepository,
    BankIntegrationRepository,
    InstrumentRepository,
    SyncRepository,
    TransactionRepository
} from '@budgie/contracts';
import { AccountBalanceIncrementalService, AccountService, TransactionImportService, TransactionService } from '@budgie/ledger';
import { RuleEngineService } from '@budgie/rules';
import * as Layer from 'effect/Layer';

import { AccountReissueMergeService } from '../service/account-reissue-merge.service';
import { FileImportDeliveredRowService } from '../service/file-import-delivered-row.service';
import { SyncOperationMetadataService } from '../service/sync-operation-metadata.service';

export const fileSyncDependenciesLayer = Layer.mergeAll(
    AccountRepository.layer,
    BankIntegrationRepository.layer,
    InstrumentRepository.layer,
    SyncRepository.layer,
    TransactionRepository.layer,
    AccountService.layer,
    AccountBalanceIncrementalService.layer,
    TransactionImportService.layer,
    TransactionService.layer,
    SyncOperationMetadataService.layer,
    RuleEngineService.layer,
    AccountReissueMergeService.layer,
    FileImportDeliveredRowService.layer
);
