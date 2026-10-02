# Sync Module

## Account-Type → Sync-Family Capability Mapping

| AccountTypeEnum | Syncs? | Sync family           | Service               | ExternalSourceEnum members |
| --------------- | ------ | --------------------- | --------------------- | -------------------------- |
| BANK_SYNC       | yes    | polling-with-history  | MonobankSyncService   | MONOBANK                   |
| BANK_SYNC       | yes    | file-import           | ErsteSyncService      | ERSTE                      |
| BANK_SYNC       | yes    | file-import           | PrivatbankSyncService | PRIVATBANK                 |
| CRYPTO_SYNC     | yes    | polling-with-snapshot | BinanceSyncService    | BINANCE                    |
| BANK            | no     | —                     | —                     | —                          |
| CASH            | no     | —                     | —                     | —                          |
| CRYPTO          | no     | —                     | —                     | —                          |
| DEBT            | no     | —                     | —                     | —                          |
| STOCKS          | no     | —                     | —                     | —                          |
| SAVINGS         | no     | —                     | —                     | —                          |

### No-service slots (registry returns `null`)

These `ExternalSourceEnum` members exist but have no service yet:
`REVOLUT`, `WISE`, `COINBASE`, `CSV`, `MANUAL`

### Composition

The sync services, family factories (`makeSyncService`, `makePollingSyncService`, `makeFileSyncService`),
`SyncProviderRegistryService`, resync, repair and transfer consolidation live in `@budgie/sync` (see
`packages/sync/AGENTS.md`). This module keeps the UI, the `.task.ts` registrations, the rule and
transfer-consolidation drainers, `AppDataSyncService`, and the port adapters in `layer/`:
`syncWorkloadLayer` (`SyncWorkload` over `Workload`, the drainers and expo background tasks),
`syncFileReaderLayer` (`SyncFileReader` over the native PDF extractor and `expo-file-system`) and
`p2pTransferTitleResolverLayer` (Lingui titles for Binance P2P transfers). `appServicesLayer` provides them.

### Adding a provider

Add the provider service in `@budgie/sync` and register it in `SyncProviderRegistryService`, add its row to
`constant/sync-provider-capabilities.constant.ts`, and add its layer to `appServicesLayer`.
