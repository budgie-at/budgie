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

Each provider is a `Context.Service` whose `make` spreads a family factory from `util/`:

```
makeSyncService (identity: provider + accountType + generateAccountTitle + accountIcon; setAccountSyncEnabled,
                 mapAccountsToPreview, getOrCreateSyncAccount)
  ├── makePollingSyncService (loop, hooks, token, background task)
  │     ├── MonobankSyncService  — polling-with-history (forward/backward paging, jar/card titles + jar icon)
  │     └── BinanceSyncService   — polling-with-snapshot (balance anchor, sources+transfers, CRYPTO_SYNC + Bitcoin icon)
  └── makeFileSyncService   (importPreview, executeImportForSelectedAccounts, quickImport)
        ├── ErsteSyncService
        └── PrivatbankSyncService
```

Registry: `SyncProviderRegistryService` in `service/sync-provider-registry.service.ts`; static per-provider capabilities live in
`constant/sync-provider-capabilities.constant.ts`.

### Adding a provider

Create a `Context.Service` whose `make` returns the matching family factory with the identity fields and hooks, add its
capabilities row, register it in `SyncProviderRegistryService`, and add its layer to `appServicesLayer`.
