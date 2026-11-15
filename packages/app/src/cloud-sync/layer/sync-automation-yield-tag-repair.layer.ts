import { SyncAutomationYieldTagRepair } from '@budgie/cloud-sync';
import { YieldTagRepairService } from '@budgie/sync';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

export const syncAutomationYieldTagRepairLayer = Layer.effect(
    SyncAutomationYieldTagRepair,
    Effect.map(YieldTagRepairService, service => (transactionSyncIds: readonly string[]) => service.repairBySyncIds(transactionSyncIds))
).pipe(Layer.provide(YieldTagRepairService.layer));
