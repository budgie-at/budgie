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
`REVOLUT`, `COINBASE`, `CSV`, `MANUAL`

`WISE` has no registered sync service either: its create-account row opens the Enable Banking flow with Wise preselected, and its accounts are `ENABLE_BANKING` accounts.

### Enable Banking entry points

The New Account screen has one `2,000+ EU banks` row (`CreateAccount.MoreBanks`) that opens `/create-account/banks`: `EnableBankingPublicBankList` loads `listPublicBanks` through `enableBankingPublicBanksAtom` and renders `EnableBankingBankStep`, with a `Bank not listed?` row (`CreateAccount.ENABLE_BANKING`) that opens the generic `/create-account/ENABLE_BANKING` flow. Picking a bank opens `/create-account/bank/[country]/[name]`, which renders `CreateEnableBankingAccount` with that bank and country preselected; the bank stays in the path because `usePathname()` is what `+native-intent.tsx` returns after the consent redirect (the setup-path hook re-encodes each segment). Wise uses `/create-account/WISE` with a name-only preselection.

### Setup screens

A new sync provider composes `SyncSetupPage`, `SyncAccountsStep`, `SyncParkedAccountsSection`, `SyncHistoryStep`, `SyncGuideSteps` and `SyncCredentialRow`, and adds only its own credential step and copy.

### Composition

The sync services, family factories (`makeSyncService`, `makePollingSyncService`, `makeFileSyncService`),
`SyncProviderRegistryService`, resync and repair live in `@budgie/sync` (see
`packages/sync/AGENTS.md`); `TransferConsolidationService` lives in `@budgie/ledger`. This module keeps the UI, the `.task.ts` registrations, the rule and
transfer-consolidation drainers, `AppDataSyncService`, and the port adapters in `layer/`:
`syncWorkloadLayer` (`SyncWorkload` over `Workload`, the drainers and expo background tasks),
`syncFileReaderLayer` (`SyncFileReader` over the native PDF extractor and `expo-file-system`) and
`p2pTransferTitleResolverLayer` (Lingui titles for Binance P2P transfers). `appServicesLayer` provides them
together with `transferConsolidationBankFlowLayer` from `@budgie/sync`.

### Adding a provider

Add the provider service in `@budgie/sync` and register it in `SyncProviderRegistryService`, add its row to
`SYNC_PROVIDER_CAPABILITIES` in `@budgie/sync`, and add its layer to `appServicesLayer`.
