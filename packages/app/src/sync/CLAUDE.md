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

### Hierarchy

```
AbstractSyncService (identity: provider + providerTitle + accountType; setAccountSyncEnabled, mapAccountsToPreview,
                     mapAccountToCreateInput, getOrCreateSyncAccount; overridable generateAccountTitle / accountIcon)
  ├── AbstractPollingSyncService (loop, hooks, token, preview, background task)
  │     ├── MonobankSyncService  — polling-with-history (forward/backward paging, jar/card titles + jar icon)
  │     └── BinanceSyncService   — polling-with-snapshot (balance anchor, sources+transfers, CRYPTO_SYNC + Bitcoin icon)
  └── AbstractFileSyncService   (importPreview, executeImportForSelectedAccounts, quickImport)
        ├── ErsteSyncService
        └── PrivatbankSyncService
```

Registry: `SyncProviderRegistryService` in `service/sync-provider-registry.service.ts`

### Adding a provider

Subclass the matching family service, declare the identity fields (`provider`, `providerTitle`, `accountType`),
override `generateAccountTitle` / `accountIcon` when the defaults don't fit, and register the instance in
`SyncProviderRegistryService`. No shared utils to edit — account materialization is inherited.
