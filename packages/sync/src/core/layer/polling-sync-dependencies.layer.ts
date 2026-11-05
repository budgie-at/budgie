import {
    AccountBalanceRepository,
    AccountRepository,
    InstrumentRepository,
    SyncRepository,
    TransactionRepository
} from '@budgie/contracts';
import { AccountService, TransactionService } from '@budgie/ledger';
import * as Layer from 'effect/Layer';

import { SyncIntegrationTokenService } from '../service/sync-integration-token.service';

export const pollingSyncDependenciesLayer = Layer.mergeAll(
    AccountRepository.layer,
    AccountBalanceRepository.layer,
    InstrumentRepository.layer,
    SyncRepository.layer,
    TransactionRepository.layer,
    AccountService.layer,
    TransactionService.layer,
    SyncIntegrationTokenService.layer
);
