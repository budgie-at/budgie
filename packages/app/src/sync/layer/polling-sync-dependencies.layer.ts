import {
    AccountBalanceRepository,
    AccountRepository,
    InstrumentRepository,
    SyncRepository,
    TransactionRepository
} from '@budgie/contracts';
import { AccountService, TransactionService } from '@budgie/ledger';
import * as Layer from 'effect/Layer';

import { Workload } from '../../@generic/service/workload.service';
import { SyncIntegrationTokenService } from '../service/sync-integration-token.service';
import { TransferConsolidationDrainerService } from '../service/transfer-consolidation-drainer.service';

export const pollingSyncDependenciesLayer = Layer.mergeAll(
    Workload.layer,
    AccountRepository.layer,
    AccountBalanceRepository.layer,
    InstrumentRepository.layer,
    SyncRepository.layer,
    TransactionRepository.layer,
    AccountService.layer,
    TransactionService.layer,
    SyncIntegrationTokenService.layer,
    TransferConsolidationDrainerService.layer
);
