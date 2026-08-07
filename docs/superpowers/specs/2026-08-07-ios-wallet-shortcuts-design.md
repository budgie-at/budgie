# iOS Wallet Shortcuts Capture Design

## Summary

Budgie will capture eligible Apple Pay tap events on iOS through a user-created Shortcuts personal automation. The automation passes Wallet-provided transaction fields to a Budgie App Intent. Native Swift code persists each capture immediately without opening the React Native UI, and Budgie imports pending captures into its encrypted transaction database when the app next becomes active.

This feature is an event-capture integration, not general access to Apple Wallet history. It has no backfill, does not read Wallet's private database, and cannot guarantee delivery for online or in-app Apple Pay purchases.

## Goals

- Capture Apple Pay tap events in Ukraine and other regions where FinanceKit is unavailable.
- Run without bringing Budgie to the foreground for each payment.
- Preserve captures while Budgie is terminated or its encrypted database is unavailable.
- Let the user choose the target Budgie account while configuring the Shortcuts action.
- Reuse Budgie's existing transaction creation, balance, rule, and embedding behavior.
- Keep all captured financial data on the device.
- Detect suspicious repeat deliveries without silently discarding legitimate repeated purchases.

## Non-goals

- Import historical transactions from Wallet.
- Replace bank synchronization or treat tap-time values as settled bank data.
- Create or silently install the personal automation on the user's behalf.
- Capture every online, in-app, recurring, cash-withdrawal, refund, or reversed transaction.
- Use FinanceKit, PassKit transaction history, notification scraping, or private APIs.
- Add an Android equivalent in this feature.

## Platform and availability

- The integration UI and native action are available only on iOS.
- The Wallet Transaction personal automation requires iOS 17 or later.
- The Budgie app continues to support its existing deployment target; App Intent declarations are availability-gated where required.
- The action is unavailable in Expo Go and requires a native development, preview, or production build.

## User setup flow

Budgie adds an **Apple Pay capture** page under Settings. The page explains the limitations and provides a step-by-step setup guide:

1. Open Shortcuts and create a personal automation.
2. Select the Wallet or Transaction trigger.
3. Select one Wallet card.
4. Select **Run Immediately**.
5. Add Budgie's **Capture Apple Pay transaction** action.
6. Bind `Amount` to `Shortcut Input → Amount`.
7. Bind `Merchant` to `Shortcut Input → Merchant`.
8. Bind the optional `Card` field to the Wallet card/pass value.
9. Select a fixed Budgie account in the action's Account picker.
10. Save the automation.

Budgie recommends one automation per Wallet card. The fixed account selection is more reliable than inferring an account from Apple's localized card display name.

The app cannot create the personal automation programmatically. The setup page may open the Shortcuts app, but the user must complete the configuration.

## Runtime architecture

```text
Wallet tap
  → Shortcuts Transaction automation
  → Budgie App Intent
  → native protected capture inbox
  → Expo module bridge
  → wallet-capture drain service
  → duplicate classification
  → rule preparation
  → transaction service
  → encrypted Budgie database
```

### Local Expo module

An iOS-only local Expo module lives in `packages/app/modules/apple-wallet-capture`. It contains:

- the Expo Modules API bridge used by TypeScript;
- the App Intent exposed to Shortcuts;
- the dynamic Budgie account entity and entity query;
- a protected file-based capture inbox;
- an atomically replaced account mirror used by the Shortcuts account picker.

The module does not access Budgie's SQLCipher database. This avoids starting React Native from a background App Intent and avoids duplicating database-key handling in Swift.

### App Group storage

Each app variant receives a variant-specific application group:

```text
group.<bundle-identifier>.wallet-capture
```

The identifier is placed in both the application-group entitlement and an Info.plist key read by the module. Development, preview, E2E, and production builds therefore cannot read one another's inboxes.

The shared container holds:

- one atomically written JSON file per capture;
- one atomically replaced JSON account-mirror file.

Files use iOS data protection. One file per capture avoids read-modify-write races when events arrive close together.

### Account mirror

Budgie mirrors the minimum data needed by the Shortcuts picker:

```ts
interface WalletCaptureAccount {
    readonly id: number;
    readonly title: string;
}
```

Only active, non-archived accounts are mirrored. The mirror is refreshed when Budgie becomes active and when the Apple Pay capture settings page opens. Account IDs remain the authoritative identity; titles are display-only.

If an automation references an account that has since been archived or deleted, the native action reports that the account is no longer available and does not enqueue a misleading capture.

### Captured record

The App Intent validates the resolved account and requires a finite amount greater than zero. It trims the merchant value, creates a UUID, and atomically persists:

```ts
interface WalletCaptureRecord {
    readonly captureId: string;
    readonly accountId: number;
    readonly amount: number;
    readonly merchant: string;
    readonly cardName: string | null;
    readonly capturedAt: string;
    readonly status: WalletCaptureStatusEnum;
    readonly duplicateTransactionId: number | null;
}
```

The initial status is `PENDING`. No card number, device account number, Apple Pay payment token, bank credential, or full Wallet pass is stored.

### Expo bridge

The native module exposes narrow asynchronous operations:

- replace the mirrored account list;
- list pending and review captures;
- mark a capture as requiring review with a candidate transaction ID;
- acknowledge capture IDs after successful import or dismissal.

The TypeScript boundary validates all returned native records with Zod before business logic receives them.

## Import behavior

The drain service runs only after database migrations and app initialization are ready. It is triggered when the app becomes active and is single-flight so repeated AppState events cannot overlap.

For each `PENDING` record:

1. Validate the native payload.
2. Verify that the target Budgie account still exists and is active.
3. Check whether `APPLE_PAY_AUTOMATION + captureId` already exists.
4. Search for a conservative semantic duplicate candidate.
5. If a candidate exists, mark the native capture `NEEDS_REVIEW` and leave it in the inbox.
6. Otherwise map it to a Budgie expense input.
7. Prepare rule actions using the existing rule engine.
8. Create the transaction through the existing transaction service.
9. Apply any post-create rule actions.
10. Acknowledge the native capture only after all required database work succeeds.

The transaction uses:

- source `APPLE_PAY_AUTOMATION`;
- external ID equal to the native capture UUID;
- type `EXPENSE`;
- a credit entry against the selected account;
- the Wallet merchant as title, or localized `Apple Pay purchase` when missing;
- the tap timestamp as `operatedAt`;
- exchange rate `1` because the amount is interpreted in the selected account's instrument.

The source name deliberately distinguishes this best-effort event from an authoritative bank feed.

## Duplicate handling

Exact reprocessing is prevented by the external source and capture UUID.

Because a repeated Shortcuts delivery can receive a new UUID, Budgie also checks for a transaction with:

- the same selected account;
- the same absolute amount;
- the same normalized merchant title;
- an operation time within two minutes;
- an expense-compatible transaction type;
- no deletion or consolidation parent.

A match is never silently deleted or merged. The capture becomes `NEEDS_REVIEW` and appears on the Apple Pay capture settings page with two actions:

- **Import anyway** creates the transaction while bypassing semantic duplicate detection, then acknowledges the capture.
- **Dismiss** acknowledges the capture without creating a transaction.

This favors correctness when two legitimate identical payments occur close together.

## Failure handling

- Invalid amount: the App Intent returns a visible Shortcuts error and writes nothing.
- Empty merchant: the capture is accepted and receives a localized fallback title during import.
- Atomic native write failure: the App Intent returns failure so Shortcuts does not show a false success.
- Invalid native JSON: Budgie reports the capture as unreadable and does not acknowledge it automatically.
- Missing or inactive account during drain: the capture remains available for review and reassignment.
- Database or rule failure: the capture remains unacknowledged and is retried on a later activation.
- Duplicate candidate: the capture remains protected until the user imports or dismisses it.
- Account mirror unavailable: the App Intent account query shows no accounts and tells the user to open Budgie once.

Failures are logged through Budgie's existing logger conventions. Sensitive merchant and amount values are not included in lifecycle logs.

## Settings experience

The Settings page adds an iOS-only Apple Pay capture card under Data management. The detail page contains:

- an explanation that this is tap-event capture, not Wallet history sync;
- an ordered setup guide;
- an **Open Shortcuts** button;
- current readiness state, including whether accounts have been mirrored;
- pending-review cards showing merchant, amount, account, and time;
- **Import anyway** and **Dismiss** actions;
- troubleshooting for missing actions, empty values, archived accounts, and unsupported payment types.

All user-facing strings are localized through Lingui.

## Privacy and security

- Processing remains offline and on-device.
- The native inbox stores only the minimum capture fields.
- Shared-container files use iOS data protection and variant-isolated app groups.
- Imported transactions move into the existing SQLCipher database.
- Native files are deleted after successful import or explicit dismissal.
- App Intent logs avoid financial payload values.

## Testing strategy

### TypeScript integration tests

A dedicated `tests/wallet-capture-tests` workspace exercises the drain service with a mocked native bridge and the real test database:

- imports a valid expense and acknowledges it;
- applies create-safe and post-create rules;
- does not re-import an existing capture UUID;
- marks a semantic duplicate for review;
- imports a reviewed duplicate when explicitly forced;
- leaves the capture pending after a database failure;
- rejects invalid native payloads;
- handles missing accounts without data loss.

### Maestro

An iOS E2E flow verifies:

- the Settings card is visible on iOS;
- the detail page renders the setup instructions;
- the Open Shortcuts action is present;
- review cards expose Import and Dismiss actions when a fixture is available.

The Wallet transaction trigger itself cannot be reliably generated in the simulator and remains a device test.

### Native and device verification

- Run Expo prebuild and confirm the module autolinks.
- Build the development app for simulator and device.
- Confirm application-group entitlements for each tested variant.
- Confirm the Budgie action and account picker appear in Shortcuts after opening Budgie once.
- Trigger a real low-value Apple Pay tap with Budgie terminated.
- Confirm the app does not foreground during capture.
- Launch Budgie and verify exactly one transaction, correct account/amount/merchant, rule application, and native-file cleanup.
- Repeat with airplane mode, an empty merchant if reproducible, and an archived target account.

## Release constraints

- Release notes describe the feature as Apple Pay tap capture through Shortcuts.
- Product copy must not call it Wallet history sync or bank synchronization.
- Initial rollout should be treated as best effort because Wallet trigger payload completeness is controlled by iOS and card issuers.

