# Cloud Sync Package

iCloud sync domain logic: record mapping, upload, apply, restore reconciliation, household sharing and the sync engine. The native `ICloud` module, the concrete transport, the state file and every atom and toast stay in `packages/app`; this package only declares ports for them.

## Commands

```bash
pnpm build                    # Build package
pnpm ts                       # Native TypeScript 7 check
pnpm lint                     # Oxlint (incl. local `lint-rules/` plugin)
```

Integration verification lives in `tests/sync-tests/src/scenarios/cloud-sync/` and runs with `pnpm --filter @budgie-at/sync-tests test`.

## Structure

```
src/
├── index.ts          # Public exports
├── mapping/          # Aggregate <-> sync record encoding, decoding, record definitions
├── upload/           # SyncUploadService: pending outbox -> upload batches, acknowledgement
├── apply/            # SyncApplyService + unit/derived-matcher services, merge utils, balance refresher layer
├── reconciliation/   # SyncRestoreReconciliationService
├── outbox/           # SyncOutboxRepository
├── share/            # HouseholdShareService and repository
├── household/        # HouseholdMembershipService, HouseholdService, household enums
├── automation/       # SyncAutomationService (post-apply rules, consolidation, recurring) and the embedding-boost port
├── transport/        # iCloud wire enums, interfaces and types shared with the native module
└── engine/           # Sync engine
    ├── port/         # Host ports the app implements
    ├── service/      # Engine services
    ├── layer/        # cloudSyncDomainLayer shared by the engine services
    ├── enum/ interface/ type/ constant/ error/ utils/
```

Tables, entities, zone constants, identity helpers and the plain repositories the app reads directly (`SyncRecordRepository`, `SyncZoneRegistryRepository`, `SyncIdentityRepository`, `SyncResetRepository`, ...) stay in `@budgie/contracts`.

## Engine services

`CloudSyncService` is the public entry point. It owns scheduling (`start`, foreground, periodic fetch, local-write drain) and exposes the handlers of the services below, which share one `CloudSyncSessionState`:

- `CloudSyncSessionState`: the single owner of mutable engine state (session `Ref`, zones, pushed/held/failed/quota keys, lock) and its publication to the host.
- `CloudSyncDrainService`: outbox drain into the transport, side records (meta, device heartbeat).
- `CloudSyncHouseholdService`: household join, discovery, share events, end/leave/stop and the shared engine.
- `CloudSyncEngineService`: engine start/stop, lineage decision and conflict resolution, reconfigure, account and zone events.
- `CloudSyncSentService`: sent-changes events, failed saves, acknowledgement.
- `CloudSyncFetchService`: fetched-changes events, did-fetch, restore reconciliation, automation hook.

Dependencies only point downward in that order, so there are no cycles. `*Unlocked` members assume the caller holds the lock.

## Ports

The app provides a layer for each of `CloudSyncTransport`, `CloudSyncStateStore`, `CloudSyncSafetyCopy`, `CloudSyncInstallId`, `CloudSyncDatabaseChanges`, `CloudSyncHost` (atoms, toasts, app state, device name) and `SyncAutomationEmbeddingBoost`. Tests provide fakes (`tests/sync-tests/src/scenarios/cloud-sync/sync-service-harness.ts`).
