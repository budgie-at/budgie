import { AccountRepository, BankIntegrationRepository, InstrumentRepository, SyncRepository } from '@budgie/contracts';
import * as Layer from 'effect/Layer';

import { Workload } from '../../@generic/service/workload.service';
import { AccountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { AccountService } from '../../account/service/account.service';
import { RuleApplicationDrainerService } from '../../rule/service/rule-application-drainer.service';
import { TransactionImportService } from '../../transaction/service/transaction-import.service';
import { TransactionService } from '../../transaction/service/transaction.service';
import { TransferConsolidationDrainerService } from '../service/transfer-consolidation-drainer.service';

export const fileSyncDependenciesLayer = Layer.mergeAll(
    Workload.layer,
    AccountRepository.layer,
    BankIntegrationRepository.layer,
    InstrumentRepository.layer,
    SyncRepository.layer,
    AccountService.layer,
    AccountBalanceIncrementalService.layer,
    RuleApplicationDrainerService.layer,
    TransactionImportService.layer,
    TransactionService.layer,
    TransferConsolidationDrainerService.layer
);
