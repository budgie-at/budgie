# CloudKit verification runbook

Manual verification of iCloud backup (#1789), own-device sync (#1795) and family sharing (#1803) on real devices. E2E cannot cover any of it: an `APP_VARIANT=e2e` build has no iCloud entitlement, no CloudKit container and no `CKSharingSupported`, and `IS_CLOUD_BACKUP_SUPPORTED` is false, so every cloud surface is hidden and the suite stays green with no cloud at all.

Run this before closing #1789, #1795 and #1803, and against the **Production** schema before each phase epic closes.

## 0. Reference

| Item | Value |
| --- | --- |
| Apple team | `3R8589YV24` |
| Dev container | `iCloud.com.vitalyiegorov.budgie.dev` (`APP_VARIANT=development`) |
| Preview container | `iCloud.com.vitalyiegorov.budgie.preview` |
| Production container | `iCloud.com.vitalyiegorov.budgie` |
| Personal zone | `personal` (`PERSONAL_SYNC_ZONE`) |
| Household zone | the zone passed to `ensureZone`/`createHouseholdShare`, one `CKShare` record `cloudkit.share` per zone |
| Backup records | private database, default zone, record type `Backup` |
| Sync records | `Account`, `BankIntegration`, `Budget`, `Category`, `DebtEvent`, `RecurringSeries`, `Rule`, `Tag`, `Transaction`, `TransactionLeg`, `SyncMeta`, `SyncDevice` |
| Schema source | `packages/app/modules/icloud/schema/Development.ckdb` |
| Estimated send batch | 100 records or 1.5 MB, whichever comes first |
| Fetched event split | 200 records, 1000 deletions |
| Environment | build signed with a development profile → Development; TestFlight/App Store → Production |

Error codes come from `ICloudErrorCode` (`packages/cloud-sync/src/transport/enum/icloud-error-code.enum.ts`). Checks name the code the native layer must emit; the expected app behaviour is stated in terms of local data and CloudKit state, not in terms of a screen, because the same engine can run without a screen.

`C1`, the backup half of `C4` and the backup half of `C5` exercise backups. The remaining checks exercise `CloudSyncService` and household sharing.

## 1. Setup

### 1.1 Apple IDs and devices

1. Enrol two Apple IDs in one Apple Family (only needed for the C8 invitation by Apple ID; a share link works without it).
2. Prepare the device matrix: **A1** owner primary, **A2** the owner's second device, both on Apple ID A; **B1** on Apple ID B (and **B2** on Apple ID B when the member's own-device sync is in scope).
3. Sign each device into its Apple ID, with iCloud Drive on and **Advanced Data Protection off** for the baseline run (F6 covers it on).
4. Give each device at least 2 GB free iCloud storage, and confirm each Apple ID has an active CloudKit-enabled developer team membership.
5. Do not use simulators for two-identity checks: a simulator inherits the host Mac's iCloud account, so two Apple IDs need two devices. A simulator is acceptable only as A2, and only for `C1`, `C4`, `C6`; background behaviour and push differ there.

Expected: Settings → Apple ID shows the intended account on each device, and `CKContainer.accountStatus()` reports `available` (`getAccountStatus`).

### 1.2 Signed dev build

1. Build the dev variant on a Mac with the team's signing identity: `cd packages/app && pnpm prebuild:dev`, then `pnpm ios:device` (or build `ios/budgieDev.xcworkspace`, scheme `budgieDev`, bundle `com.vitalyiegorov.budgie.dev`, from Xcode with a development profile).
2. Install on A1, A2 and B1, launch, and complete onboarding on each.
3. Enable logging for the run by starting Metro with `APP_VARIANT=development EXPO_PUBLIC_AI_DISABLE=true pnpm start --port 8082`; the `Effect.fn` spans and the typed cloud errors are the only place the native codes surface today.
4. Confirm the app shows Settings → Your data → **iCloud backup** with a switch, and **Restore from iCloud**. An E2E build shows neither.

Expected: both rows are present, the backup switch is on by default, and Settings → Data tools → **Rebuild balances** exists for the money check.

Traps: `pnpm ios:device` can serve an EAS-cached binary for a matching fingerprint ("Searching builds with matching fingerprint" in the log); if the build date is not this commit, build with `xcodebuild` instead. `expo prebuild` needs `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8`.

### 1.3 Deploy the schema to Development

1. Save a management token once: `xcrun cktool save-token --type management`.
2. Validate the checked-in schema:

```bash
export CK_TEAM=3R8589YV24
export CK_CONTAINER=iCloud.com.vitalyiegorov.budgie.dev
xcrun cktool validate-schema --team-id "$CK_TEAM" --container-id "$CK_CONTAINER" \
  --environment development --file packages/app/modules/icloud/schema/Development.ckdb
```

3. Import it:

```bash
xcrun cktool import-schema --team-id "$CK_TEAM" --container-id "$CK_CONTAINER" \
  --environment development --file packages/app/modules/icloud/schema/Development.ckdb --validate
```

4. Repeat for `CK_CONTAINER=iCloud.com.vitalyiegorov.budgie.preview` if preview builds are in the run.
5. Open <https://icloud.developer.apple.com/dashboard> → the container → Schema → Development and confirm every record type and field, including the `encrypted` marker on payload fields.
6. Start a run only when step 3 exits clean; a rejected import leaves the previous schema in place and the app will fail record saves with `UNKNOWN_ITEM` or `CONSTRAINT_VIOLATION`.

Expected: `validate-schema` exits 0, the console lists all thirteen app record types (plus `Users` and `cloudkit.share`), and every payload field except `schemaVersion` is encrypted.

### 1.4 Promote the schema to Production before release

1. Deploy Production **before** the store build that writes new fields; a write to a field Production does not have fails the save.
2. In the console: Schema → **Deploy Schema Changes** → confirm. Promotion is additive: record types and fields cannot be removed, and index changes need a separate deploy.
3. Verify what Production actually has:

```bash
xcrun cktool export-schema --team-id 3R8589YV24 \
  --container-id iCloud.com.vitalyiegorov.budgie --environment production --output-file /tmp/production.ckdb
```

4. Confirm `/tmp/production.ckdb` contains every record type and field in `Development.ckdb`; do not commit `/tmp/production.ckdb`.

Expected: the exported Production schema is a superset of the checked-in schema. If it is not, stop the release: an older app on a newer schema pauses the zone (`schemaVersion`), and a newer app on an older schema cannot save.

Resetting Development (`xcrun cktool reset-schema --team-id "$CK_TEAM" --container-id "$CK_CONTAINER"`) copies Production's schema over Development and **deletes every Development record**; use it to get back to a clean run, and expect the app to see `ZONE_NOT_FOUND` on the next save.

## 2. Native checks

### C1 Encrypted field round trip

1. On A1 create one account, one category and three transactions with a distinctive title such as `zz-cloudkit-canary`.
2. Wait for the 10-minute change debounce, then background the app. The first backup on a fresh install uploads immediately; later uploads need the previous one to be at least 1 hour old.
3. Open the console → Private Database → `_defaultZone` → record type `Backup`, newest record.
4. Read the same record from the CLI:

```bash
xcrun cktool query-records --team-id "$CK_TEAM" --container-id "$CK_CONTAINER" \
  --environment development --database-type private --record-type Backup --limit 5
```

5. Inspect the sync records: console → Private Database → zone `personal` → `Account`, `Transaction`.

Expected: `createdAt`, `installId`, `deviceName`, `deviceModel`, `appVersion`, `schemaVersion` and the `archive` asset size are readable; `backupKey` and every `Account`/`Transaction` payload field show no value in either the console or the CLI output; the canary title appears in neither. Restore from iCloud on a second device of Apple ID A returns the canary transaction, which proves the encrypted value round-trips through `encryptedValues`.

### C2 `SERVER_RECORD_CHANGED` on a conflicting save

1. On A1 and A2, open the same transaction. Confirm both have synced it.
2. Put A2 in airplane mode.
3. Rename the transaction to `conflict-from-A1` on A1 and to `conflict-from-A2` on A2.
4. Let A1 sync, then take A2 out of airplane mode and sync.

Expected: A2's save fails with `SERVER_RECORD_CHANGED` and carries the server record; the app merges the server record with A2's changed fields and resends; both devices end on `conflict-from-A2` (a user edit beats an automatic one), with one record in `personal` and no duplicate. `failedSaves` reports the code once, not on every retry.

### C3 `ZONE_NOT_FOUND` and a user-deleted zone

1. Sync a clean install so the `personal` zone exists and holds records.
2. Reset the Development environment (`xcrun cktool reset-schema …` as above), which deletes all data, or delete the zone from the console.
3. Sync from the app.
4. Separately, delete the zone from the console while the app is running and wait for the next fetch.

Expected, both cases: the fetch emits `onZoneChange` `deleted` with reason `DELETED` (`PURGED` after CloudKit purges it) and `syncNow`/saves report `ZONE_NOT_FOUND`. The app stops syncing that zone, keeps every local row and every balance intact, and re-creates the zone only for a deliberate re-upload. No local transaction, account or balance is deleted, and no duplicate appears after the re-upload.

### C4 Encrypted data reset

1. In the console, reset the Development environment and reset its encrypted data (the reset dialog has a separate encrypted-data option); alternatively reset encrypted data from an Apple device's iCloud settings. The control's wording varies by iOS version, so confirm the checkbox before confirming the reset.
2. Launch the app and open Settings → Your data → Restore from iCloud.

Expected: the native layer emits `onZoneChange` `deleted` with reason `ENCRYPTED_DATA_RESET`; the backups page shows "Backups made before your iCloud encrypted data was reset can't be read."; a restore of an older backup fails with `CloudRestoreFailureEnum.UNREADABLE` and changes nothing locally; sync re-creates the zone and re-uploads local data, so the ledger survives intact on the device.

### C5 Quota exceeded

1. Use an Apple ID whose iCloud storage is full (a 5 GB account holding ~5 GB of photos), or fill it until Settings → Apple ID → iCloud reports full.
2. Change data, background the app, and check Settings → Your data → iCloud backup.
3. Sync a new transaction from A1.

Expected: backup stops with `QUOTA_EXCEEDED` → the status atom becomes `STORAGE_FULL` and the row reads "iCloud storage full" with the switch still on; no partial backup record is left in `_defaultZone`. The sync save is reported in `failedSaves` with `QUOTA_EXCEEDED` and the local row stays pending in the outbox. CloudKit does not retry quota errors (`isRetriedByEngine` excludes them), so the engine drops its pending copy; the app must re-enqueue from the outbox once space is free. If the record never resends after storage is cleared, that is a defect, not an expected result.

### C6 Batch size limits

1. Import a CSV with 250 transactions on A1, or create them in one run.
2. Watch the `onSentChanges` events in the console log during upload.
3. On A2, confirm the records arrive in more than one `onFetchedChanges` event.
4. Create one transaction whose `entries` payload is close to CloudKit's 1 MB record limit (a transfer with a large entry set) and sync it.

Expected: each send batch holds at most 100 records and at most 1.5 MB of estimated bytes, so 250 transactions arrive as at least three `onSentChanges` events and the upload resumes from the first unsent record after an interruption. A record over `SYNC_RECORD_MAX_BYTES` (900 KB) is rejected on the device and shows an ERROR status. `LIMIT_EXCEEDED` in `failedSaves` occurs only when CloudKit rejects a record.

### C7 Engine state restored after relaunch

1. Sync to idle, then force-quit from the app switcher and relaunch.
2. Sync again with no local edits.
3. Repeat with the persisted `stateSerialization` corrupted (replace the stored value with `{}`).

Expected: on the clean relaunch `startSync` receives the stored serialization, no `INVALID_STATE` is thrown, no record is re-sent (the relaunch sends nothing and CloudKit `modificationDate` is unchanged), and no full refetch of `personal` happens. On the corrupted serialization the engine fails with `INVALID_STATE`, and the app discards the state, full-fetches the zone and continues without crashing or duplicating rows.

### C8 Shared database identities

1. On A1 create the Household share and invite Apple ID B.
2. Accept on B1 through the link or the Mail/iMessage invitation; the app receives `onShareAccepted` with outcome `ACCEPTED` and the owner's display name.
3. Create a shared account and a transaction on each side, then sync both.
4. Query participants from both devices.

Expected: shared records carry the owner's `ownerName`, never `__defaultOwner__`; `onFetchedChanges` delivers them with `scope` `SHARED`; `getShareParticipants` lists A1 as `OWNER`, B1 as `PRIVATE_USER` with acceptance `ACCEPTED` and permission `READ_WRITE`, and `isCurrentUser` is true for exactly one row on each device. Both sides converge on the same ledger, and a transfer to a private account shows the private leg as an opaque placeholder on the other side.

## 3. Failure injections

Run each injection, then the money check in section 4 before moving on.

### F1 Airplane mode mid-batch

1. Create or edit more than one send batch of records (see C6) on A1.
2. Turn on airplane mode while the upload is in flight.
3. Turn airplane mode off after 30 seconds.

Expected: the batch fails with `NETWORK_UNAVAILABLE`, the sync row stays 'Syncing…' and resumes on its own; if a backup was due, the backup row reads 'Waiting for network', nothing is lost or duplicated, and the upload resumes from the outbox. `NETWORK_UNAVAILABLE` is in `isRetriedByEngine`, so the engine keeps the pending change itself and does not need a manual retry.

### F2 Force-quit during apply

Run three times, killing during apply, after the SQLite commit, and before state serialization is persisted:

1. Create data on A1; on A2 start a sync and kill the app while `onFetchedChanges` is being applied.
2. Relaunch A2 and let it sync.
3. Repeat at the other two points.

Expected: events are consumed one at a time by `Stream.runForEach`. A failed batch sets `isBatchFailed`, so `handleStateSerialization` skips persistence. The batch is fetched again after relaunch and applied without duplicates. Balances on A2 match A1.

### F3 Sign out of iCloud mid-sync

1. Start a sync on A1, then sign out of iCloud in Settings → Apple ID while it runs.
2. Sign back in to the same Apple ID.
3. Sync.

Expected: `onAccountChange` arrives with `SIGN_OUT` and the previous user record name; pending saves are dropped in the native layer; the app pauses sync and keeps all local data. The backup and sync rows read "Sign in to iCloud to turn on". Signing back in emits `SIGN_IN`, and the next sync converges with A2 without duplicates.

### F4 Switch Apple ID

1. With data on A1 under Apple ID A, sync to idle.
2. Sign out and sign in with Apple ID B on the same device.
3. Sync, create a transaction, then sign back into Apple ID A and sync.

Expected: `onAccountChange` arrives with `SWITCH_ACCOUNTS`, both record names, and the app stays paused — no row from Apple ID A's ledger is ever uploaded to Apple ID B's container. Apple ID B's ledger is empty (or its own), A's data stays local and untouched, and switching back to A resumes the original sync. If any of A's records appear under B, stop the run and file a P0.

### F5 iCloud Keychain off

1. Turn off Settings → Apple ID → iCloud → Passwords and Keychain.
2. Restart the app, open Settings → Your data → Restore from iCloud, and pick any backup.
3. Turn iCloud Keychain back on and restore again.

Expected: with Keychain off, encrypted fields are unavailable: the backup's `backupKey` cannot be read, restore fails with `BACKUP_KEY_UNAVAILABLE` → `CloudRestoreFailureEnum.KEYCHAIN_UNAVAILABLE` and the message "Finish setting up iCloud Keychain, then try again"; no local data changes. With Keychain back on the same backup restores successfully. The install id in the Keychain is `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`, so it must survive the toggle unchanged in the backup list grouping.

### F6 Advanced Data Protection on and off

1. With a synced ledger and one backup, turn on Settings → Apple ID → iCloud → Advanced Data Protection, completing the recovery-key setup.
2. Sync, back up, restore on A2, then turn ADP off again.

Expected: no app-visible change in either direction — same records, same backup list, same balances; every write keeps succeeding (a re-encryption in progress may surface `SERVICE_BUSY`, which is retried). The product claim stays "encrypted in iCloud; end-to-end with Advanced Data Protection": with ADP on only the owner and share participants hold the keys, with it off Apple can recover them.

### F7 iCloud storage full

Repeat C5 as an injection at the worst moment: start a 250-record first upload, fill the account, and let it fail.

Expected: the upload stops at the failing batch with `QUOTA_EXCEEDED`, previously saved records stay in CloudKit, nothing is rolled back locally, and the app keeps the remaining records pending. After storage is freed the upload resumes and A2 converges.

### F8 Share revoked

1. Owner A1 stops sharing (sharing sheet, or `stopSharing`), while member B1 is offline.
2. Bring B1 online and sync.

Expected: the owner sees `onShareChanged` with `STOPPED`; B1's next fetch sees the zone deleted with reason `ACCESS_LOST` and the shared records disappear from B1's device. B1's `Personal` accounts, transactions and balances are unchanged, and B1's backups no longer include the owner's `Household` rows.

### F9 Member removed

1. Owner A1 removes B1 as a participant (`removeParticipant`).
2. Sync B1.
3. Separately, repeat with B1 leaving voluntarily (`leaveShare`).

Expected: after removal, every shared account and its transactions disappear from B1's device on the next sync, and B1's `Personal` balances are unchanged; `getShareParticipants` on A1 lists B1 as acceptance `REMOVED` until the removal settles. After a voluntary leave, B1 keeps a local copy moved into `Personal` with fresh `sync_id`s, balances still match the ledger, and later edits by A1 no longer arrive. An offline B1 keeps the data until it next syncs, and the copy says so.

## 4. Money check after every run

Run on **every** device that took part, after sync settles:

1. Record each account's displayed total and transaction count, and the number of accounts.
2. Settings → Data tools → **Rebuild balances** (subtitle "Recalculate from transactions"), confirm, wait for "Balances rebuilt".
3. Re-read the totals and counts.
4. Compare the same account's total and count across devices.
5. On a device that restored a backup, also take Settings → **Backup file** and run the replay from the repo root:

```bash
pnpm verify:backup <path-to-.db>
```

Expected: step 3 changes nothing — the rebuilt totals equal the totals before the rebuild, which is the app-visible proof that stored `account_balances` equal the ledger (`getLedgerBalances`). Step 4 shows identical totals and counts on both devices. `pnpm verify:backup` exits 0 with zero mismatched accounts; any output stays local and is never pasted into an issue.

A change in step 3, a mismatch in step 4, or a non-zero `verify:backup` fails the run: record `M1 FAIL`, keep the device state, and file the defect before re-running.

## 5. Recording a run

Post one comment on #1971 per run, and link it from #1795 and #1803. Record the outcome of every check, not just the failures, and keep the money check result in the same comment.

```text
CloudKit run — <date> <UTC time>
Build: <commit sha> · dev variant · <Development|Production> schema
Devices: A = <model, iOS version> · B = <model, iOS version>
Apple IDs: <alias A> / <alias B>          (aliases, never the addresses)

| Check | Result | Evidence |
| --- | --- | --- |
| C1 encrypted round trip | PASS | backupKey empty in console and cktool; restore returned canary |
| C2 SERVER_RECORD_CHANGED | PASS | failedSaves code + merged title |
| ... | ... | ... |
| M1 money check | PASS | 12 accounts, A: 3 totals unchanged after rebuild, B matches A |
```

Rules for the record:

- Never paste balances, account titles, device names or Apple ID addresses; use aliases, counts and the first 8 characters of a `sync_id` when an account must be identified.
- Every phase epic closes only with a recorded run against the **Production** schema, taken on a build signed with a distribution profile.
- Validation for the closing PR is unchanged: `pnpm format && pnpm ts && pnpm lint && pnpm deadcode && pnpm cpd`.
