import {
    SettingsRepository,
    SyncIdentityRepository,
    SyncRecordRepository,
    SyncResetRepository,
    SyncZoneRegistryRepository
} from '@budgie/contracts';
import * as Layer from 'effect/Layer';

import { syncAccountBalanceRefresherLayer } from '../../apply/layer/sync-account-balance-refresher.layer';
import { SyncApplyService } from '../../apply/service/sync-apply.service';
import { HouseholdMembershipService } from '../../household/service/household-membership.service';
import { SyncOutboxRepository } from '../../outbox/repository/sync-outbox.repository';
import { SyncRestoreReconciliationService } from '../../reconciliation/service/sync-restore-reconciliation.service';
import { HouseholdShareService } from '../../share/service/household-share.service';
import { SyncUploadService } from '../../upload/service/sync-upload.service';
import { BankOwnershipService } from '../service/bank-ownership.service';

const applyLayer = SyncApplyService.layer.pipe(Layer.provide(syncAccountBalanceRefresherLayer));

export const cloudSyncDomainLayer = Layer.mergeAll(
    SettingsRepository.layer,
    SyncUploadService.layer,
    applyLayer,
    SyncRestoreReconciliationService.layer.pipe(Layer.provide(applyLayer)),
    HouseholdMembershipService.layer.pipe(Layer.provide(syncAccountBalanceRefresherLayer)),
    HouseholdShareService.layer,
    SyncOutboxRepository.layer,
    SyncRecordRepository.layer,
    SyncZoneRegistryRepository.layer,
    SyncIdentityRepository.layer,
    SyncResetRepository.layer,
    BankOwnershipService.layer
);
