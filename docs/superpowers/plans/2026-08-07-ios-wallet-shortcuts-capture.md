# iOS Wallet Shortcuts Capture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Capture eligible Apple Pay tap events through an iOS Shortcuts personal automation and import them reliably into Budgie's encrypted local transaction database.

**Architecture:** An iOS-only local Expo module exposes a background App Intent and persists captures as protected atomic files in a variant-specific App Group. React Native validates and drains those records when Budgie becomes active, routes safe captures through the existing rule and transaction services, and surfaces conservative duplicate candidates for explicit user review.

**Tech Stack:** Expo SDK 56, Expo Modules API, Swift, App Intents, Expo config plugins, React Native, TypeScript, Zod, Drizzle/SQLite/SQLCipher, Lingui, Vitest integration tests, Maestro.

**Design:** `docs/superpowers/specs/2026-08-07-ios-wallet-shortcuts-design.md`

---

## File map

### Native module and prebuild integration

- `packages/app/modules/apple-wallet-capture/expo-module.config.json` — autolinks the iOS-only Expo module.
- `packages/app/modules/apple-wallet-capture/apple-wallet-capture.podspec` — compiles the Swift bridge and store.
- `packages/app/modules/apple-wallet-capture/ios/AppleWalletCaptureModule.swift` — narrow Expo Modules API bridge.
- `packages/app/modules/apple-wallet-capture/ios/AppleWalletCaptureStore.swift` — protected atomic account mirror and capture inbox.
- `packages/app/modules/apple-wallet-capture/ios/AppleWalletCaptureRecord.swift` — native Codable record types.
- `packages/app/modules/apple-wallet-capture/plugin/BudgieWalletCaptureIntent.swift` — app-target App Intent and AppEntity declarations.
- `packages/app/modules/apple-wallet-capture/plugin/with-apple-wallet-capture.js` — config plugin that sets the App Group/Info.plist values and adds the App Intent Swift file to the generated app target.
- `packages/app/modules/apple-wallet-capture/app.plugin.js` — config-plugin entry point.
- `packages/app/modules/apple-wallet-capture/src/apple-wallet-capture.ts` — typed `requireNativeModule` wrapper.
- `packages/app/app.config.js` — invokes the module plugin with a variant-specific App Group identifier.

The App Intent declarations are copied into the generated application target instead of living only in the CocoaPod target. This guarantees Xcode includes their metadata in the app bundle without requiring a cross-target `AppIntentsPackage` registration layer.

### Contracts and persistence queries

- `packages/contracts/src/account/enum/external-source.enum.ts` — adds `APPLE_PAY_AUTOMATION`.
- `packages/contracts/src/transaction/interface/potential-expense-duplicate-input.interface.ts` — generic duplicate-query input.
- `packages/contracts/src/transaction/repository/transaction.repository.ts` — finds a conservative duplicate candidate by account, amount, normalized title, and time window.
- `packages/contracts/src/index.ts` — directly exports the new input interface.

### Application domain

- `packages/app/src/wallet-capture/constant/wallet-capture-native-record-schema.constant.ts` — validates native records with Zod.
- `packages/app/src/wallet-capture/enum/wallet-capture-status.enum.ts` — mirrors native status values.
- `packages/app/src/wallet-capture/enum/wallet-capture-review-reason.enum.ts` — names review states shared by service and UI.
- `packages/app/src/wallet-capture/interface/wallet-capture-account.interface.ts` — minimum account mirror shape.
- `packages/app/src/wallet-capture/interface/wallet-capture-native-module.interface.ts` — Expo bridge contract.
- `packages/app/src/wallet-capture/interface/wallet-capture-native-record.interface.ts` — validated native record type.
- `packages/app/src/wallet-capture/interface/wallet-capture-review-item.interface.ts` — UI-ready review item.
- `packages/app/src/wallet-capture/service/wallet-capture-account-mirror.service.ts` — refreshes the native account picker data.
- `packages/app/src/wallet-capture/service/wallet-capture-import.service.ts` — single-flight drain, duplicate classification, rule application, and acknowledgement.
- `packages/app/src/wallet-capture/service/wallet-capture-native.service.ts` — validates bridge output and owns native operations.
- `packages/app/src/wallet-capture/component/apple-pay-capture-settings-card/apple-pay-capture-settings-card.tsx` — Settings entry point.
- `packages/app/src/wallet-capture/component/wallet-capture-review-card/wallet-capture-review-card.tsx` — explicit Import/Dismiss controls.
- `packages/app/src/wallet-capture/hook/use-wallet-capture-settings.hook.ts` — page state and actions.
- `packages/app/src/app/(tabs)/settings/apple-pay-capture.tsx` — setup, status, troubleshooting, and review page.
- `packages/app/src/app/(tabs)/settings/index.tsx` — renders the iOS-only Settings card.
- `packages/app/src/app/root-layout-content.tsx` — refreshes the account mirror and drains captures after initialization and on activation.

### Verification

- `tests/wallet-capture-tests/package.json` — isolated integration-test workspace.
- `tests/wallet-capture-tests/vitest.config.ts` — shared Budgie test configuration.
- `tests/wallet-capture-tests/tsconfig.json` — TypeScript configuration.
- `tests/wallet-capture-tests/src/harness/scenario/setup.ts` — real test DB and mocked native boundary.
- `tests/wallet-capture-tests/src/harness/seed/seed.ts` — test-kit seed service bound to the Wallet capture database.
- `tests/wallet-capture-tests/src/harness/native/wallet-capture-native.stub.ts` — deterministic inbox stub.
- `tests/wallet-capture-tests/src/scenarios/import/wallet-capture-import.test.ts` — import, idempotency, rules, failure, and review scenarios.
- `tests/app-tests/flows/29.apple-pay-capture-settings.flow.yaml` — iOS setup-page Maestro coverage.
- `packages/app/src/i18n/locales/{en,de,es,fr,uk}.{po,ts}` — localized setup and review copy.

---

### Task 1: Create the Wallet capture integration-test workspace

**Files:**

- Create: `tests/wallet-capture-tests/package.json`
- Create: `tests/wallet-capture-tests/tsconfig.json`
- Create: `tests/wallet-capture-tests/vitest.config.ts`
- Create: `tests/wallet-capture-tests/src/harness/scenario/setup.ts`
- Create: `tests/wallet-capture-tests/src/harness/seed/seed.ts`

- [ ] **Step 1: Add the workspace package**

Create `tests/wallet-capture-tests/package.json`:

```json
{
    "name": "@budgie-at/wallet-capture-tests",
    "version": "1.0.0",
    "private": true,
    "type": "module",
    "scripts": {
        "test": "vitest run",
        "test:coverage": "vitest run",
        "test:watch": "vitest",
        "ts": "tsc --noEmit"
    },
    "dependencies": {
        "@budgie-at/test-kit": "workspace:*",
        "@budgie/contracts": "workspace:^",
        "@rnw-community/shared": "^2.2.0",
        "better-sqlite3": "^12.10.0",
        "drizzle-orm": "^0.45.2",
        "vitest": "^4.1.7"
    },
    "devDependencies": {
        "@types/better-sqlite3": "^7.6.13",
        "@types/node": "^24.5.2",
        "typescript": "^5.9.3"
    }
}
```

- [ ] **Step 2: Add TypeScript and Vitest configuration**

Create `tests/wallet-capture-tests/tsconfig.json`:

```json
{
    "extends": "../../tsconfig.json",
    "compilerOptions": {
        "noEmit": true,
        "types": ["node", "vitest/globals"]
    },
    "include": ["src/**/*.ts"]
}
```

Create `tests/wallet-capture-tests/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

import { createTestVitestConfig } from '@budgie-at/test-kit/vitest';

export default defineConfig(createTestVitestConfig(__dirname, 'src/harness/scenario/setup.ts', true));
```

- [ ] **Step 3: Configure the real test database**

Create `tests/wallet-capture-tests/src/harness/scenario/setup.ts` following the bank-sync harness:

```ts
import { afterEach, beforeEach, vi } from 'vitest';

import { buildTestDb, createTestRepositories, resetTestDb } from '@budgie-at/test-kit';

export const testDb = buildTestDb();

vi.mock('@app/@generic/drizzle/db/db', async () => ({
    db: testDb,
    ...createTestRepositories(testDb),
    expoDb: undefined,
    __REMOVE_ME_RESET_DB: async () => undefined
}));

vi.mock('@budgie/contracts', async importOriginal => {
    const actual = await importOriginal<typeof import('@budgie/contracts')>();
    return {
        ...actual,
        transactionAsync: async <T>(database: unknown, callback: (transaction: unknown) => Promise<T>): Promise<T> => callback(database)
    };
});

beforeEach(() => {
    resetTestDb(testDb);
});

afterEach(() => {
    vi.restoreAllMocks();
});
```

- [ ] **Step 4: Bind the shared seed service to the test database**

Create `tests/wallet-capture-tests/src/harness/seed/seed.ts`:

```ts
import { TestSeedService } from '@budgie-at/test-kit';

import { testDb } from '../scenario/setup';

export const seed = new TestSeedService(testDb);
```

- [ ] **Step 5: Install and prove the empty workspace is discoverable**

Run:

```bash
yarn install
yarn workspace @budgie-at/wallet-capture-tests ts
yarn workspace @budgie-at/wallet-capture-tests test
```

Expected: install succeeds; TypeScript and Vitest finish without configuration errors and report no test files yet.

- [ ] **Step 6: Commit the harness**

```bash
git add tests/wallet-capture-tests yarn.lock
git commit -m "test(app): isolate Wallet capture integration coverage" \
  -m "Constraint: Production app packages cannot host unit tests.\nConfidence: high\nScope-risk: narrow\nTested: Wallet capture workspace TypeScript and empty Vitest run."
```

---

### Task 2: Add the source identity and duplicate-candidate query

**Files:**

- Modify: `packages/contracts/src/account/enum/external-source.enum.ts`
- Create: `packages/contracts/src/transaction/interface/potential-expense-duplicate-input.interface.ts`
- Modify: `packages/contracts/src/transaction/repository/transaction.repository.ts`
- Modify: `packages/contracts/src/index.ts`
- Create: `tests/wallet-capture-tests/src/scenarios/import/wallet-capture-duplicate-query.test.ts`

- [ ] **Step 1: Write the failing duplicate-query scenario**

Create a scenario that seeds an active account, an expense transaction with one credit entry, then calls the repository with the same account, title, micro-unit amount, and a timestamp 90 seconds later:

```ts
import { describe, expect, it } from 'vitest';

import { ExternalSourceEnum } from '@budgie/contracts';

import { transactionRepository } from '@app/@generic/drizzle/db/db';

import { seed } from '../../harness/seed/seed';

describe('Wallet capture duplicate query', () => {
    it('returns a nearby matching expense and excludes a different amount', async () => {
        seed.instrument();
        const account = seed.account({ title: 'Wallet card' });
        const operatedAt = new Date('2026-08-07T10:00:00.000Z');
        const transaction = seed.bankPairExpense(
            { externalId: 'capture-existing', operatedAt },
            {
                accountId: account.id,
                amount: 125_000_000,
                mccCategoryId: null
            }
        );
        seed.updateTransaction(transaction.id, {
            externalSource: ExternalSourceEnum.APPLE_PAY_AUTOMATION,
            title: 'Silpo'
        });

        await expect(
            transactionRepository.findPotentialExpenseDuplicate({
                accountId: account.id,
                amountInMicroUnits: 125_000_000,
                normalizedTitle: 'silpo',
                operatedAt: new Date('2026-08-07T10:01:30.000Z'),
                timeWindowSeconds: 120
            })
        ).resolves.toBe(transaction.id);
        await expect(
            transactionRepository.findPotentialExpenseDuplicate({
                accountId: account.id,
                amountInMicroUnits: 126_000_000,
                normalizedTitle: 'silpo',
                operatedAt: new Date('2026-08-07T10:01:30.000Z'),
                timeWindowSeconds: 120
            })
        ).resolves.toBeNull();
    });
});
```

- [ ] **Step 2: Run the scenario and verify the missing API**

Run:

```bash
yarn workspace @budgie-at/wallet-capture-tests test src/scenarios/import/wallet-capture-duplicate-query.test.ts
```

Expected: FAIL because `APPLE_PAY_AUTOMATION` and `findPotentialExpenseDuplicate` do not exist.

- [ ] **Step 3: Add the source enum member and query input**

Add to `ExternalSourceEnum`:

```ts
APPLE_PAY_AUTOMATION = 'APPLE_PAY_AUTOMATION'
```

Create `potential-expense-duplicate-input.interface.ts`:

```ts
export interface PotentialExpenseDuplicateInputInterface {
    readonly accountId: number;
    readonly amountInMicroUnits: number;
    readonly normalizedTitle: string;
    readonly operatedAt: Date;
    readonly timeWindowSeconds: number;
}
```

Export the interface directly from `packages/contracts/src/index.ts`.

- [ ] **Step 4: Implement the generic repository query**

Add a public method before private methods in `TransactionRepository`:

```ts
@Log(
    input =>
        `enter accountId=${input.accountId} operatedAt=${input.operatedAt.toISOString()} timeWindowSeconds=${input.timeWindowSeconds}`,
    (result, input) =>
        `done accountId=${input.accountId} operatedAt=${input.operatedAt.toISOString()} timeWindowSeconds=${input.timeWindowSeconds} result=${result ?? ''}`,
    (error, input) =>
        `throw accountId=${input.accountId} operatedAt=${input.operatedAt.toISOString()} timeWindowSeconds=${input.timeWindowSeconds} error=${getErrorMessage(error)}`
)
async findPotentialExpenseDuplicate(input: PotentialExpenseDuplicateInputInterface, tx?: DB): Promise<number | null> {
    const lowerBound = new Date(input.operatedAt.getTime() - input.timeWindowSeconds * 1000);
    const upperBound = new Date(input.operatedAt.getTime() + input.timeWindowSeconds * 1000);
    const [candidate] = await (tx ?? this.db)
        .select({ id: TransactionEntityTable.id })
        .from(TransactionEntityTable)
        .innerJoin(TransactionEntryEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
        .where(
            and(
                isNull(TransactionEntityTable.deletedAt),
                isNull(TransactionEntityTable.consolidationParentTransactionId),
                inArray(TransactionEntityTable.type, [TransactionTypeEnum.EXPENSE, TransactionTypeEnum.DEBT]),
                eq(TransactionEntryEntityTable.accountId, input.accountId),
                eq(TransactionEntryEntityTable.type, TransactionEntryTypeEnum.CREDIT),
                eq(TransactionEntryEntityTable.amount, input.amountInMicroUnits),
                eq(sql`LOWER(TRIM(${TransactionEntityTable.title}))`, input.normalizedTitle),
                gte(TransactionEntityTable.operatedAt, lowerBound),
                lte(TransactionEntityTable.operatedAt, upperBound)
            )
        )
        .limit(1);

    return candidate?.id ?? null;
}
```

Add the required `lte`, transaction-entry table/type, and input-interface imports. Do not log merchant or amount values.

- [ ] **Step 5: Run the focused test and contracts TypeScript**

Run:

```bash
yarn workspace @budgie-at/wallet-capture-tests test src/scenarios/import/wallet-capture-duplicate-query.test.ts
yarn workspace @budgie/contracts ts
```

Expected: PASS.

- [ ] **Step 6: Commit the contract**

```bash
git add packages/contracts/src tests/wallet-capture-tests/src/scenarios/import/wallet-capture-duplicate-query.test.ts
git commit -m "feat(contracts): identify Apple Pay automation captures" \
  -m "Constraint: Shortcuts supplies no stable bank transaction identity.\nRejected: Silent fingerprint deduplication | Identical legitimate purchases must remain reviewable.\nConfidence: high\nScope-risk: moderate\nTested: Duplicate-query integration scenario and contracts TypeScript."
```

---

### Task 3: Scaffold the iOS-only Expo module and configure prebuild

**Files:**

- Create: `packages/app/modules/apple-wallet-capture/**`
- Create: `packages/app/modules/apple-wallet-capture/app.plugin.js`
- Create: `packages/app/modules/apple-wallet-capture/plugin/with-apple-wallet-capture.js`
- Create: `packages/app/modules/apple-wallet-capture/plugin/BudgieWalletCaptureIntent.swift`
- Modify: `packages/app/app.config.js`

- [ ] **Step 1: Generate the local module scaffold**

From `packages/app`, run:

```bash
EXPO_NONINTERACTIVE=1 yarn dlx create-expo-module@latest apple-wallet-capture \
  --local \
  --name AppleWalletCapture \
  --package expo.modules.applewalletcapture \
  --platform apple \
  --features AsyncFunction
```

Expected: `packages/app/modules/apple-wallet-capture` contains `expo-module.config.json`, a podspec, `ios/AppleWalletCaptureModule.swift`, and `src/apple-wallet-capture.ts`; no Android or view files are generated.

- [ ] **Step 2: Reduce the scaffold to the intended module shape**

Ensure `expo-module.config.json` is:

```json
{
    "platforms": ["apple"],
    "apple": {
        "modules": ["AppleWalletCaptureModule"]
    }
}
```

Keep the generated podspec source glob covering `ios/**/*.{h,m,mm,swift,hpp,cpp}` and set iOS deployment compatibility to the app's existing minimum. Remove generated example methods and files not used by later tasks.

- [ ] **Step 3: Add a variant-specific App Group to app config**

Add beside `getUniqueIdentifier`:

```js
const getWalletCaptureAppGroupIdentifier = () => `group.${getUniqueIdentifier(false)}.wallet-capture`;
```

Add the plugin after `expo-build-properties`:

```js
[
    './modules/apple-wallet-capture/app.plugin.js',
    {
        appGroupIdentifier: getWalletCaptureAppGroupIdentifier()
    }
],
```

- [ ] **Step 4: Implement the plugin entry and mods**

Create `app.plugin.js`:

```js
module.exports = require('./plugin/with-apple-wallet-capture');
```

Implement `with-apple-wallet-capture.js` with `withEntitlementsPlist`, `withInfoPlist`, `withDangerousMod`, and `withXcodeProject` so it:

1. writes `com.apple.security.application-groups: [appGroupIdentifier]` without dropping existing entitlements;
2. writes `BudgieWalletCaptureAppGroupIdentifier` to Info.plist;
3. copies `BudgieWalletCaptureIntent.swift` into the generated iOS app source directory;
4. adds that file exactly once to the main app target's Sources build phase.

Use the following exported shape:

```js
const { withDangerousMod, withEntitlementsPlist, withInfoPlist, withXcodeProject } = require('expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');

const INFO_PLIST_KEY = 'BudgieWalletCaptureAppGroupIdentifier';
const SWIFT_FILE_NAME = 'BudgieWalletCaptureIntent.swift';

module.exports = function withAppleWalletCapture(config, { appGroupIdentifier }) {
    const withEntitlements = withEntitlementsPlist(config, result => {
        const currentGroups = result.modResults['com.apple.security.application-groups'] ?? [];
        result.modResults['com.apple.security.application-groups'] = [...new Set([...currentGroups, appGroupIdentifier])];
        return result;
    });
    const withPlist = withInfoPlist(withEntitlements, result => {
        result.modResults[INFO_PLIST_KEY] = appGroupIdentifier;
        return result;
    });
    const withSource = withDangerousMod(withPlist, [
        'ios',
        async result => {
            const projectName = result.modRequest.projectName;
            const destination = path.join(result.modRequest.platformProjectRoot, projectName, SWIFT_FILE_NAME);
            fs.copyFileSync(path.join(__dirname, SWIFT_FILE_NAME), destination);
            return result;
        }
    ]);

    return withXcodeProject(withSource, result => {
        const project = result.modResults;
        const projectName = result.modRequest.projectName;
        const sourcePath = `${projectName}/${SWIFT_FILE_NAME}`;
        const targetUuid = project.getFirstTarget().uuid;
        if (!project.hasFile(sourcePath)) {
            project.addSourceFile(sourcePath, { target: targetUuid }, projectName);
        }
        return result;
    });
};
```

If the installed `xcode` project API differs, inspect the generated `with-vec-xcframework-fix.js` plugin and Expo config-plugin typings, then preserve the same four outcomes. Do not edit generated `ios/` files by hand.

- [ ] **Step 5: Add a compile-probe app-target file**

Initially create `plugin/BudgieWalletCaptureIntent.swift`:

```swift
import AppIntents
import AppleWalletCapture

@available(iOS 17.0, *)
enum BudgieWalletCaptureBuildProbe {}
```

This proves the generated app target can import the CocoaPod module before adding the real action.

- [ ] **Step 6: Run prebuild and inspect generated native configuration**

Run:

```bash
yarn workspace @budgie-at/app prebuild:dev
rg -n "BudgieWalletCapture|wallet-capture|application-groups" packages/app/ios
```

Expected: the module is in Pods/autolinking, the Swift file appears once in the app target, the development App Group is present in entitlements and Info.plist, and the Xcode project contains one Sources reference.

- [ ] **Step 7: Commit the scaffold and plugin**

```bash
git add packages/app/app.config.js packages/app/modules/apple-wallet-capture
git commit -m "build(app): register Wallet capture native surface" \
  -m "Constraint: App Intent metadata must be emitted from the generated application target.\nRejected: Hand-editing generated iOS project files | Expo prebuild must remain reproducible.\nConfidence: medium\nScope-risk: moderate\nTested: Development prebuild, entitlement inspection, and generated Xcode source membership."
```

---

### Task 4: Implement protected native storage and the Shortcuts action

**Files:**

- Create: `packages/app/modules/apple-wallet-capture/ios/AppleWalletCaptureRecord.swift`
- Create: `packages/app/modules/apple-wallet-capture/ios/AppleWalletCaptureStore.swift`
- Modify: `packages/app/modules/apple-wallet-capture/ios/AppleWalletCaptureModule.swift`
- Replace: `packages/app/modules/apple-wallet-capture/plugin/BudgieWalletCaptureIntent.swift`

- [ ] **Step 1: Define Codable native records**

Use exact cross-language field names and uppercase status values:

```swift
import Foundation

public enum AppleWalletCaptureStatus: String, Codable {
  case pending = "PENDING"
  case needsReview = "NEEDS_REVIEW"
}

public struct AppleWalletCaptureAccount: Codable, Sendable {
  public let id: Int
  public let title: String
}

public struct AppleWalletCaptureRecord: Codable, Sendable {
  public let captureId: String
  public let accountId: Int
  public let amount: Double
  public let merchant: String
  public let cardName: String?
  public let capturedAt: String
  public let status: AppleWalletCaptureStatus
  public let duplicateTransactionId: Int?
}
```

- [ ] **Step 2: Implement one-file-per-capture protected storage**

`AppleWalletCaptureStore` must:

- resolve the group identifier from `BudgieWalletCaptureAppGroupIdentifier`;
- use `FileManager.containerURL(forSecurityApplicationGroupIdentifier:)`;
- atomically replace `accounts.json`;
- atomically create `<captureId>.json` inside `captures/`;
- apply `.completeUntilFirstUserAuthentication` file protection;
- sort returned captures by `capturedAt`, then `captureId`;
- update a capture to `NEEDS_REVIEW` atomically;
- delete only explicitly acknowledged UUID filenames;
- reject path traversal by parsing every capture ID as `UUID` before building a path.

Expose these public async methods:

```swift
public actor AppleWalletCaptureStore {
  public static let shared = AppleWalletCaptureStore()

  public func replaceAccounts(_ accounts: [AppleWalletCaptureAccount]) throws
  public func accounts() throws -> [AppleWalletCaptureAccount]
  public func enqueue(accountId: Int, amount: Double, merchant: String, cardName: String?) throws -> AppleWalletCaptureRecord
  public func captures() throws -> [AppleWalletCaptureRecord]
  public func markNeedsReview(captureId: String, duplicateTransactionId: Int) throws
  public func acknowledge(captureIds: [String]) throws
}
```

Use `ISO8601DateFormatter` with fractional seconds for `capturedAt`. Treat a missing App Group, invalid UUID, unreadable JSON, or atomic write failure as a thrown error; never return success after a failed durable write.

- [ ] **Step 3: Implement the Expo bridge**

Replace generated examples in `AppleWalletCaptureModule.swift`:

```swift
import ExpoModulesCore

public final class AppleWalletCaptureModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AppleWalletCapture")

    AsyncFunction("replaceAccounts") { (accounts: [AppleWalletCaptureAccount]) in
      try await AppleWalletCaptureStore.shared.replaceAccounts(accounts)
    }

    AsyncFunction("getCaptures") {
      try await AppleWalletCaptureStore.shared.captures()
    }

    AsyncFunction("markNeedsReview") { (captureId: String, duplicateTransactionId: Int) in
      try await AppleWalletCaptureStore.shared.markNeedsReview(
        captureId: captureId,
        duplicateTransactionId: duplicateTransactionId
      )
    }

    AsyncFunction("acknowledgeCaptures") { (captureIds: [String]) in
      try await AppleWalletCaptureStore.shared.acknowledge(captureIds: captureIds)
    }
  }
}
```

If Expo Modules Core cannot decode custom Codable structs directly, accept dictionaries at the bridge only and map them into the Codable domain records inside `AppleWalletCaptureModule`; keep the public JavaScript field contract unchanged.

- [ ] **Step 4: Replace the compile probe with the real App Entity and Intent**

The app-target Swift source must define:

```swift
import AppIntents
import AppleWalletCapture

@available(iOS 17.0, *)
struct BudgieWalletAccountEntity: AppEntity {
  static let typeDisplayRepresentation = TypeDisplayRepresentation(name: "Budgie account")
  static let defaultQuery = BudgieWalletAccountQuery()

  let id: Int
  let title: String

  var displayRepresentation: DisplayRepresentation {
    DisplayRepresentation(title: "\(title)")
  }
}

@available(iOS 17.0, *)
struct BudgieWalletAccountQuery: EntityQuery {
  func entities(for identifiers: [Int]) async throws -> [BudgieWalletAccountEntity] {
    let identifiersSet = Set(identifiers)
    return try await AppleWalletCaptureStore.shared.accounts()
      .filter { identifiersSet.contains($0.id) }
      .map { BudgieWalletAccountEntity(id: $0.id, title: $0.title) }
  }

  func suggestedEntities() async throws -> [BudgieWalletAccountEntity] {
    try await AppleWalletCaptureStore.shared.accounts()
      .map { BudgieWalletAccountEntity(id: $0.id, title: $0.title) }
  }
}

@available(iOS 17.0, *)
struct CaptureApplePayTransactionIntent: AppIntent {
  static let title: LocalizedStringResource = "Capture Apple Pay transaction"
  static let description = IntentDescription("Save an Apple Pay tap for import into Budgie.")
  static let openAppWhenRun = false

  @Parameter(title: "Amount") var amount: Double
  @Parameter(title: "Merchant") var merchant: String
  @Parameter(title: "Card") var cardName: String?
  @Parameter(title: "Account") var account: BudgieWalletAccountEntity

  static var parameterSummary: some ParameterSummary {
    Summary("Capture \(.$amount) at \(.$merchant) in \(.$account)")
  }

  func perform() async throws -> some IntentResult & ProvidesDialog {
    guard amount.isFinite, amount > 0 else {
      throw AppleWalletCaptureIntentError.invalidAmount
    }
    let availableAccounts = try await AppleWalletCaptureStore.shared.accounts()
    guard availableAccounts.contains(where: { $0.id == account.id }) else {
      throw AppleWalletCaptureIntentError.accountUnavailable
    }
    try await AppleWalletCaptureStore.shared.enqueue(
      accountId: account.id,
      amount: amount,
      merchant: merchant.trimmingCharacters(in: .whitespacesAndNewlines),
      cardName: cardName?.trimmingCharacters(in: .whitespacesAndNewlines)
    )
    return .result(dialog: "Saved to Budgie")
  }
}

@available(iOS 17.0, *)
enum AppleWalletCaptureIntentError: Error, CustomLocalizedStringResourceConvertible {
  case invalidAmount
  case accountUnavailable

  var localizedStringResource: LocalizedStringResource {
    switch self {
    case .invalidAmount: "The Wallet amount is missing or invalid."
    case .accountUnavailable: "Open Budgie and refresh the available accounts."
    }
  }
}
```

If Xcode 26 warns about `openAppWhenRun`, keep it for iOS 17–25 compatibility. Do not switch exclusively to iOS 26's `supportedModes` until Budgie raises its minimum deployment target.

- [ ] **Step 5: Prebuild and compile the native surface**

Run:

```bash
yarn workspace @budgie-at/app prebuild:dev
xcodebuild -workspace packages/app/ios/budgie.xcworkspace \
  -scheme budgie \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  CODE_SIGNING_ALLOWED=NO build
```

Expected: BUILD SUCCEEDED with no App Intent metadata extraction error, no missing `AppleWalletCapture` module, and no duplicate Swift source membership.

- [ ] **Step 6: Commit the native behavior**

```bash
git add packages/app/modules/apple-wallet-capture
git commit -m "feat(app): persist Wallet automation captures natively" \
  -m "Constraint: The App Intent must finish without launching React Native.\nRejected: Shared JSON array | Concurrent read-modify-write can lose captures.\nConfidence: medium\nScope-risk: moderate\nDirective: Preserve atomic file writes and iOS data protection for financial payloads.\nTested: Clean prebuild and unsigned iOS simulator build."
```

---

### Task 5: Add the validated TypeScript native boundary

**Files:**

- Modify: `packages/app/modules/apple-wallet-capture/src/apple-wallet-capture.ts`
- Create: `packages/app/src/wallet-capture/enum/wallet-capture-status.enum.ts`
- Create: `packages/app/src/wallet-capture/interface/wallet-capture-account.interface.ts`
- Create: `packages/app/src/wallet-capture/interface/wallet-capture-native-module.interface.ts`
- Create: `packages/app/src/wallet-capture/interface/wallet-capture-native-record.interface.ts`
- Create: `packages/app/src/wallet-capture/constant/wallet-capture-native-record-schema.constant.ts`
- Create: `packages/app/src/wallet-capture/service/wallet-capture-native.service.ts`
- Create: `tests/wallet-capture-tests/src/harness/native/wallet-capture-native.stub.ts`
- Modify: `tests/wallet-capture-tests/src/harness/scenario/setup.ts`

- [ ] **Step 1: Define the domain enum and interfaces**

```ts
export enum WalletCaptureStatusEnum {
    PENDING = 'PENDING',
    NEEDS_REVIEW = 'NEEDS_REVIEW'
}
```

```ts
export interface WalletCaptureAccountInterface {
    readonly id: number;
    readonly title: string;
}
```

```ts
export interface WalletCaptureNativeModuleInterface {
    readonly replaceAccounts: (accounts: WalletCaptureAccountInterface[]) => Promise<void>;
    readonly getCaptures: () => Promise<unknown>;
    readonly markNeedsReview: (captureId: string, duplicateTransactionId: number) => Promise<void>;
    readonly acknowledgeCaptures: (captureIds: string[]) => Promise<void>;
}
```

- [ ] **Step 2: Validate native records at the boundary**

Create the schema constant:

```ts
import { z } from 'zod';

import { WalletCaptureStatusEnum } from '../enum/wallet-capture-status.enum';

export const WalletCaptureNativeRecordSchema = z.object({
    captureId: z.uuid(),
    accountId: z.number().int().positive(),
    amount: z.number().positive().finite(),
    merchant: z.string(),
    cardName: z.string().nullable(),
    capturedAt: z.iso.datetime({ offset: true }),
    status: z.enum(WalletCaptureStatusEnum),
    duplicateTransactionId: z.number().int().positive().nullable()
});

export const WalletCaptureNativeRecordsSchema = z.array(WalletCaptureNativeRecordSchema);
```

Create the canonical inferred type in the interface file:

```ts
import { z } from 'zod';

import type { WalletCaptureNativeRecordSchema } from '../constant/wallet-capture-native-record-schema.constant';

export type WalletCaptureNativeRecordInterface = z.infer<typeof WalletCaptureNativeRecordSchema>;
```

- [ ] **Step 3: Implement the direct module wrapper and validating service**

`modules/apple-wallet-capture/src/apple-wallet-capture.ts`:

```ts
import { requireNativeModule } from 'expo';

import type { WalletCaptureNativeModuleInterface } from '../../../src/wallet-capture/interface/wallet-capture-native-module.interface';

export const appleWalletCaptureNativeModule = requireNativeModule<WalletCaptureNativeModuleInterface>('AppleWalletCapture');
```

`wallet-capture-native.service.ts`:

```ts
import { Log } from '@budgie/logger';
import { getErrorMessage } from '@rnw-community/shared';

import { appleWalletCaptureNativeModule } from '../../../modules/apple-wallet-capture/src/apple-wallet-capture';
import { WalletCaptureNativeRecordsSchema } from '../constant/wallet-capture-native-record-schema.constant';

import type { WalletCaptureAccountInterface } from '../interface/wallet-capture-account.interface';
import type { WalletCaptureNativeRecordInterface } from '../interface/wallet-capture-native-record.interface';

class WalletCaptureNativeService {
    @Log(accounts => `enter accountIds=${accounts.map(account => account.id).join(',')}`, 'done', (error, accounts) =>
        `throw accountIds=${accounts.map(account => account.id).join(',')} error=${getErrorMessage(error)}`
    )
    async replaceAccounts(accounts: WalletCaptureAccountInterface[]): Promise<void> {
        await appleWalletCaptureNativeModule.replaceAccounts(accounts);
    }

    @Log('enter', result => `done captureIds=${result.map(record => record.captureId).join(',')}`, error =>
        `throw error=${getErrorMessage(error)}`
    )
    async getCaptures(): Promise<WalletCaptureNativeRecordInterface[]> {
        return WalletCaptureNativeRecordsSchema.parse(await appleWalletCaptureNativeModule.getCaptures());
    }

    async markNeedsReview(captureId: string, duplicateTransactionId: number): Promise<void> {
        await appleWalletCaptureNativeModule.markNeedsReview(captureId, duplicateTransactionId);
    }

    async acknowledgeCaptures(captureIds: string[]): Promise<void> {
        await appleWalletCaptureNativeModule.acknowledgeCaptures(captureIds);
    }
}

export const walletCaptureNativeService = new WalletCaptureNativeService();
```

Add full `@Log` hooks to the final two public methods as required by the repository logging contract; log only IDs.

- [ ] **Step 4: Add and register the stateful native inbox stub**

Create `tests/wallet-capture-tests/src/harness/native/wallet-capture-native.stub.ts` with a class because the harness intentionally owns mutable inbox state:

```ts
import { WalletCaptureStatusEnum } from '@app/wallet-capture/enum/wallet-capture-status.enum';

import type { WalletCaptureAccountInterface } from '@app/wallet-capture/interface/wallet-capture-account.interface';
import type { WalletCaptureNativeRecordInterface } from '@app/wallet-capture/interface/wallet-capture-native-record.interface';

export class WalletCaptureNativeStub {
    private accounts: WalletCaptureAccountInterface[] = [];
    private records: WalletCaptureNativeRecordInterface[] = [];

    async replaceAccounts(accounts: WalletCaptureAccountInterface[]): Promise<void> {
        this.accounts = [...accounts];
    }

    async getCaptures(): Promise<WalletCaptureNativeRecordInterface[]> {
        return [...this.records];
    }

    async markNeedsReview(captureId: string, duplicateTransactionId: number): Promise<void> {
        this.records = this.records.map(record =>
            record.captureId === captureId
                ? { ...record, status: WalletCaptureStatusEnum.NEEDS_REVIEW, duplicateTransactionId }
                : record
        );
    }

    async acknowledgeCaptures(captureIds: string[]): Promise<void> {
        const acknowledgedIds = new Set(captureIds);
        this.records = this.records.filter(record => !acknowledgedIds.has(record.captureId));
    }

    seed(records: WalletCaptureNativeRecordInterface[]): void {
        this.records = [...records];
    }

    reset(): void {
        this.accounts = [];
        this.records = [];
    }
}

export const walletCaptureNativeStub = new WalletCaptureNativeStub();
```

Import the stub in `src/harness/scenario/setup.ts`, add:

```ts
vi.mock('@app/wallet-capture/service/wallet-capture-native.service', () => ({
    walletCaptureNativeService: walletCaptureNativeStub
}));
```

and call `walletCaptureNativeStub.reset()` in `beforeEach` after `resetTestDb(testDb)`.

- [ ] **Step 5: Run app and test-workspace TypeScript**

Run:

```bash
yarn workspace @budgie-at/app ts
yarn workspace @budgie-at/wallet-capture-tests ts
```

Expected: PASS with no type assertions and no `any`.

- [ ] **Step 6: Commit the boundary**

```bash
git add packages/app/modules/apple-wallet-capture/src packages/app/src/wallet-capture tests/wallet-capture-tests/src/harness
git commit -m "feat(app): validate Wallet capture native records" \
  -m "Constraint: Native and Shortcuts payloads are untrusted external data.\nConfidence: high\nScope-risk: narrow\nDirective: Keep Zod validation at the native boundary before business logic.\nTested: App TypeScript."
```

---

### Task 6: Implement capture mapping, draining, rules, and review classification

**Files:**

- Create: `packages/app/src/wallet-capture/interface/wallet-capture-review-item.interface.ts`
- Create: `packages/app/src/wallet-capture/enum/wallet-capture-review-reason.enum.ts`
- Create: `packages/app/src/wallet-capture/service/wallet-capture-import.service.ts`
- Create: `tests/wallet-capture-tests/src/scenarios/import/wallet-capture-import.test.ts`

- [ ] **Step 1: Write failing integration scenarios**

Cover these assertions in `wallet-capture-import.test.ts` using the real test database and `walletCaptureNativeStub`:

```ts
describe('Wallet capture import', () => {
    it('creates an expense, applies matching rules, and acknowledges the capture', async () => {});
    it('acknowledges an already imported capture UUID without creating another transaction', async () => {});
    it('marks a nearby semantic duplicate for review without creating it', async () => {});
    it('imports a reviewed duplicate when forceImport is called', async () => {});
    it('dismisses a reviewed duplicate without creating it', async () => {});
    it('keeps a capture pending when transaction creation fails', async () => {});
    it('keeps a capture pending when its account no longer exists', async () => {});
    it('reports invalid native payloads without acknowledging inbox data', async () => {});
});
```

Use a fixed valid record factory:

```ts
const buildCapture = (overrides: Partial<WalletCaptureNativeRecordInterface> = {}): WalletCaptureNativeRecordInterface => ({
    captureId: '8e3f58ae-cd1c-45c8-91da-e54a5c8ea111',
    accountId: 1,
    amount: 125,
    merchant: 'Silpo',
    cardName: 'Mono Black',
    capturedAt: '2026-08-07T10:00:00.000Z',
    status: WalletCaptureStatusEnum.PENDING,
    duplicateTransactionId: null,
    ...overrides
});
```

Seed an account/instrument/category/rule using the existing test-kit and bank-sync test patterns. Verify persisted transaction source, UUID, title, credit amount in micro-units, account balance, category from the rule, and empty native inbox.

- [ ] **Step 2: Run and verify the missing service**

Run:

```bash
yarn workspace @budgie-at/wallet-capture-tests test src/scenarios/import/wallet-capture-import.test.ts
```

Expected: FAIL because `walletCaptureImportService` does not exist.

- [ ] **Step 3: Define the shared review reason and result**

```ts
export enum WalletCaptureReviewReasonEnum {
    DUPLICATE = 'DUPLICATE',
    ACCOUNT_UNAVAILABLE = 'ACCOUNT_UNAVAILABLE',
    INVALID_PAYLOAD = 'INVALID_PAYLOAD'
}
```

```ts
import type { WalletCaptureReviewReasonEnum } from '../enum/wallet-capture-review-reason.enum';
import type { WalletCaptureNativeRecordInterface } from './wallet-capture-native-record.interface';

export interface WalletCaptureReviewItemInterface {
    readonly capture: WalletCaptureNativeRecordInterface;
    readonly duplicateTransactionId: number | null;
    readonly reason: WalletCaptureReviewReasonEnum;
}
```

- [ ] **Step 4: Implement the single-flight import service**

The class owns its orchestration helpers; do not create single-use utilities. Public API:

```ts
class WalletCaptureImportService {
    private drainPromise: Promise<WalletCaptureReviewItemInterface[]> | null = null;

    drain(): Promise<WalletCaptureReviewItemInterface[]> {
        this.drainPromise ??= this.drainInner().finally(() => {
            this.drainPromise = null;
        });
        return this.drainPromise;
    }

    async forceImport(captureId: string): Promise<void>
    async dismiss(captureId: string): Promise<void>
    async getReviewItems(): Promise<WalletCaptureReviewItemInterface[]>
}
```

`drainInner` must:

1. get validated native captures;
2. acknowledge records whose `captureId` already exists under `APPLE_PAY_AUTOMATION`;
3. leave `NEEDS_REVIEW` records untouched;
4. resolve the account with `accountService.findByIdOrFail`;
5. call `transactionRepository.findPotentialExpenseDuplicate` with `convertToMicroUnits(record.amount)`, normalized `merchant.trim().toLocaleLowerCase()`, and `120` seconds;
6. mark semantic matches for review;
7. map safe records to `TransactionCreateInputInterface`;
8. call `ruleEngineService.prepareCreateInputsForRules`;
9. call `transactionService.bulkCreate`;
10. call `ruleEngineService.applyRulesToTransactions` only for returned post-create indexes, following `MonobankSyncService.createNewTransactions`;
11. acknowledge only successfully completed capture IDs.

The private mapper returns:

```ts
{
    amount: record.amount,
    title: isNotEmptyString(record.merchant) ? record.merchant.trim() : i18n._(msg`Apple Pay purchase`),
    comment: '',
    type: TransactionTypeEnum.EXPENSE,
    exchangeRate: 1,
    operatedAt: new Date(record.capturedAt),
    externalId: record.captureId,
    updatedBy: null,
    externalSource: ExternalSourceEnum.APPLE_PAY_AUTOMATION,
    fromAccountId: record.accountId,
    toAccountId: null,
    tagIds: [],
    entries: [
        {
            accountId: record.accountId,
            type: TransactionEntryTypeEnum.CREDIT,
            amount: record.amount,
            categoryId: null,
            categorySource: CategorySourceEnum.USER,
            mccCategoryId: null,
            externalId: record.captureId,
            exchangeRate: 1,
            toIban: null
        }
    ]
}
```

`forceImport` locates only a `NEEDS_REVIEW` record, bypasses semantic detection, executes the same rules/create path, then acknowledges. `dismiss` acknowledges exactly one requested record. Missing capture IDs are no-ops so repeated UI actions remain idempotent.

Import `i18n` from `@lingui/core` and `msg` from `@lingui/core/macro`. Use `@Log` on every public and private async class method; log capture IDs, account IDs, result counts, and errors, never merchants or amounts.

- [ ] **Step 5: Make error boundaries preserve native data**

Process captures sequentially or use `Promise.allSettled` with per-record acknowledgement. A failure for one capture must not prevent safe records from importing and must never acknowledge the failed record. Do not catch-and-log inside `@Log` methods; return review results for expected missing-account conditions and let unexpected errors be recorded by the decorator at the granular method boundary.

- [ ] **Step 6: Run all Wallet capture integration scenarios**

Run:

```bash
yarn workspace @budgie-at/wallet-capture-tests test
yarn workspace @budgie-at/wallet-capture-tests ts
```

Expected: PASS for creation, rule application, exact idempotency, semantic review, force import, dismissal, and retry preservation.

- [ ] **Step 7: Commit the import pipeline**

```bash
git add packages/app/src/wallet-capture tests/wallet-capture-tests
git commit -m "feat(app): import Wallet captures through transaction rules" \
  -m "Constraint: Native captures must remain durable until database and rule work succeeds.\nRejected: Automatic semantic deduplication | Nearby identical payments can both be legitimate.\nConfidence: high\nScope-risk: moderate\nTested: Wallet capture integration suite and TypeScript."
```

---

### Task 7: Mirror active accounts and drain on app activation

**Files:**

- Create: `packages/app/src/wallet-capture/service/wallet-capture-account-mirror.service.ts`
- Modify: `packages/app/src/app/root-layout-content.tsx`
- Modify: `tests/wallet-capture-tests/src/scenarios/import/wallet-capture-import.test.ts`

- [ ] **Step 1: Add a failing mirror scenario**

Seed active, inactive, and archived accounts. Assert that refresh writes only the active, non-archived IDs and titles to the native stub.

- [ ] **Step 2: Implement the mirror service**

```ts
import { Log } from '@budgie/logger';
import { getErrorMessage } from '@rnw-community/shared';

import { accountRepository } from '../../@generic/drizzle/db/db';

import { walletCaptureNativeService } from './wallet-capture-native.service';

class WalletCaptureAccountMirrorService {
    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async refresh(): Promise<void> {
        const accounts = await accountRepository.getAllActiveAccounts();
        await walletCaptureNativeService.replaceAccounts(accounts.filter(account => account.isActive).map(({ id, title }) => ({ id, title })));
    }
}

export const walletCaptureAccountMirrorService = new WalletCaptureAccountMirrorService();
```

`getAllActiveAccounts` already excludes archived rows but does not exclude `isActive = false`; retain the explicit boolean filter shown above.

- [ ] **Step 3: Attach both operations to the existing activation owner**

In `RootLayoutContent`, extend the existing `useAppState` activation callback after initialization/migrations are ready:

```ts
await Promise.all([
    walletCaptureAccountMirrorService.refresh(),
    walletCaptureImportService.drain()
]);
```

Do not add a new mount-only wrapper hook. The root layout already owns app activation and foreground synchronization. Handle expected failures at this call site with the existing error-reporting pattern so one Wallet failure does not block Monobank or exchange-rate activation work.

- [ ] **Step 4: Run focused tests and app TypeScript**

```bash
yarn workspace @budgie-at/wallet-capture-tests test
yarn workspace @budgie-at/app ts
```

Expected: PASS; activation code does not create a second app-state listener.

- [ ] **Step 5: Commit lifecycle integration**

```bash
git add packages/app/src/app/root-layout-content.tsx packages/app/src/wallet-capture tests/wallet-capture-tests
git commit -m "feat(app): drain Wallet captures on activation" \
  -m "Constraint: App-level providers own singleton startup and activation ordering.\nRejected: Feature-specific mount hook | It would duplicate lifecycle ownership.\nConfidence: high\nScope-risk: moderate\nTested: Wallet capture integration suite and app TypeScript."
```

---

### Task 8: Add setup and duplicate-review UI

**Files:**

- Create: `packages/app/src/wallet-capture/component/apple-pay-capture-settings-card/apple-pay-capture-settings-card.tsx`
- Create: `packages/app/src/wallet-capture/component/apple-pay-capture-settings-card/apple-pay-capture-settings-card.selector.ts`
- Create: `packages/app/src/wallet-capture/component/wallet-capture-review-card/wallet-capture-review-card.tsx`
- Create: `packages/app/src/wallet-capture/component/wallet-capture-review-card/wallet-capture-review-card.selector.ts`
- Create: `packages/app/src/wallet-capture/hook/use-wallet-capture-settings.hook.ts`
- Create: `packages/app/src/app/(tabs)/settings/apple-pay-capture.tsx`
- Create: `packages/app/src/app/(tabs)/settings/apple-pay-capture.selector.ts`
- Modify: `packages/app/src/app/(tabs)/settings/index.tsx`
- Modify: `packages/app/src/app/(tabs)/settings/settings-page.selector.ts`

- [ ] **Step 1: Add the iOS-only Settings entry**

The card uses `Platform.OS === 'ios'` outside JSX to decide whether to render. It navigates to `/settings/apple-pay-capture`, uses an existing appropriate `UserIconNameEnum` icon, and says:

- title: `Apple Pay capture`
- description: `Automatically record eligible card taps using Shortcuts`

Do not render a disabled Android card in v1.

- [ ] **Step 2: Build page state without a one-effect wrapper hook**

`useWalletCaptureSettings` earns a hook boundary by owning review state, loading state, refresh, force-import, dismiss, and refresh-after-action behavior:

```ts
export const useWalletCaptureSettings = () => {
    const [reviewItems, setReviewItems] = useState<WalletCaptureReviewItemInterface[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage(null);
        try {
            await walletCaptureAccountMirrorService.refresh();
            setReviewItems(await walletCaptureImportService.getReviewItems());
        } catch (error) {
            setErrorMessage(getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    }, []);

    const importCapture = useCallback(async (captureId: string) => {
        await walletCaptureImportService.forceImport(captureId);
        await refresh();
    }, [refresh]);

    const dismissCapture = useCallback(async (captureId: string) => {
        await walletCaptureImportService.dismiss(captureId);
        await refresh();
    }, [refresh]);

    return { reviewItems, isLoading, errorMessage, refresh, importCapture, dismissCapture };
};
```

The page's existing effect calls `refresh`; do not create another hook whose only job is that effect.

- [ ] **Step 3: Implement the setup page**

Use existing `Page`, `PageHeader`, `Card`, `SettingsGroup`, `SimpleHorizontalCell`, and `Button` patterns. The page must include:

1. a warning card: `Captures new eligible Apple Pay taps. It cannot import Wallet history or final bank settlement changes.`
2. the ten setup steps from the design;
3. an `Open Shortcuts` button using `Linking.openURL('shortcuts://')` after `Linking.canOpenURL`;
4. a `Needs review` group when review items exist;
5. troubleshooting copy for missing action, empty amount/merchant, and archived account.
6. a localized error card when a native file is unreadable or account refresh fails; do not acknowledge the affected inbox data.

Extract each repeated review record to `WalletCaptureReviewCard`; do not use a render function containing the card JSX.

- [ ] **Step 4: Implement review actions**

Each review card shows merchant fallback, formatted amount through the account/instrument formatting utilities, captured time, account title, and candidate transaction link when present. Buttons:

- `Import anyway` calls `importCapture(captureId)`;
- `Dismiss` presents the existing confirmation-dialog pattern, then calls `dismissCapture(captureId)`.

Disable both while that capture is mutating. Keep mutation state in the page hook keyed by capture ID rather than one global boolean.

- [ ] **Step 5: Add stable selectors**

Use selectors such as:

```ts
export const ApplePayCaptureSettingsSelector = {
    Container: 'ApplePayCaptureSettings.Container',
    OpenShortcutsButton: 'ApplePayCaptureSettings.OpenShortcutsButton',
    ReviewCard: (captureId: string) => `ApplePayCaptureSettings.ReviewCard.${captureId}` as const,
    ImportButton: (captureId: string) => `ApplePayCaptureSettings.ImportButton.${captureId}` as const,
    DismissButton: (captureId: string) => `ApplePayCaptureSettings.DismissButton.${captureId}` as const
};
```

- [ ] **Step 6: Run app TypeScript before localization compilation**

```bash
yarn workspace @budgie-at/app ts
```

Expected: PASS.

- [ ] **Step 7: Commit the UI**

```bash
git add packages/app/src/app packages/app/src/wallet-capture
git commit -m "feat(app): guide Wallet automation setup and review" \
  -m "Constraint: iOS does not allow Budgie to create personal automations programmatically.\nConfidence: high\nScope-risk: moderate\nDirective: Keep setup copy explicit about tap-only and non-settlement limitations.\nTested: App TypeScript and manual screen review in simulator."
```

---

### Task 9: Localize the experience and add Maestro coverage

**Files:**

- Modify: `packages/app/src/i18n/locales/en.po`
- Modify: `packages/app/src/i18n/locales/de.po`
- Modify: `packages/app/src/i18n/locales/es.po`
- Modify: `packages/app/src/i18n/locales/fr.po`
- Modify: `packages/app/src/i18n/locales/uk.po`
- Modify: `packages/app/src/i18n/locales/en.ts`
- Modify: `packages/app/src/i18n/locales/de.ts`
- Modify: `packages/app/src/i18n/locales/es.ts`
- Modify: `packages/app/src/i18n/locales/fr.ts`
- Modify: `packages/app/src/i18n/locales/uk.ts`
- Create: `tests/app-tests/flows/29.apple-pay-capture-settings.flow.yaml`

- [ ] **Step 1: Extract the new messages**

Run:

```bash
yarn workspace @budgie-at/app i18n:extract
```

Expected: new Apple Pay capture setup, warning, troubleshooting, and review messages appear in every `.po` catalog.

- [ ] **Step 2: Translate every new message**

Provide complete human-readable translations for German, Spanish, French, and Ukrainian. Preserve `Apple Pay`, `Wallet`, `Shortcuts`, and `Budgie` product names. Do not leave empty `msgstr` entries.

- [ ] **Step 3: Compile catalogs**

```bash
yarn workspace @budgie-at/app i18n:compile
```

Expected: all five TypeScript catalogs update and compilation reports no missing or invalid message.

- [ ] **Step 4: Add the settings E2E flow**

Create `29.apple-pay-capture-settings.flow.yaml`:

```yaml
appId: ${APP_ID}
---
- openLink: 'budgie://settings?anchor=data'
- waitForAnimationToEnd
- scrollUntilVisible:
      element:
          id: 'SettingsPage.ApplePayCaptureCard'
      direction: DOWN
- tapOn:
      id: 'SettingsPage.ApplePayCaptureCard'
- extendedWaitUntil:
      visible:
          id: 'ApplePayCaptureSettings.Container'
      timeout: 10000
- assertVisible: 'Apple Pay capture'
- assertVisible: '.*Wallet history.*'
- assertVisible:
      id: 'ApplePayCaptureSettings.OpenShortcutsButton'
```

Do not tap the Open Shortcuts button in the automated suite because it leaves the application and creates simulator-version variability.

- [ ] **Step 5: Run localization and Maestro smoke checks**

```bash
yarn i18n:check
maestro test tests/app-tests/flows/29.apple-pay-capture-settings.flow.yaml
```

Expected: catalog check passes and the setup page flow passes on the configured iOS E2E build.

- [ ] **Step 6: Commit localization and E2E coverage**

```bash
git add packages/app/src/i18n/locales tests/app-tests/flows/29.apple-pay-capture-settings.flow.yaml
git commit -m "test(app): cover Wallet capture setup guidance" \
  -m "Constraint: The simulator cannot synthesize a real Wallet Transaction trigger.\nConfidence: high\nScope-risk: narrow\nTested: Lingui catalog check and Apple Pay capture settings Maestro flow.\nNot-tested: Real transaction automation delivery remains a device test."
```

---

### Task 10: Perform full validation and real-device acceptance

**Files:**

- Modify only files required to fix validation or device findings within this feature scope.

- [ ] **Step 1: Run the complete repository validation sequence**

```bash
yarn format
yarn ts
yarn lint
yarn deadcode
yarn cpd
```

Expected: every command exits 0. Review formatter changes before staging and retain only feature-related changes.

- [ ] **Step 2: Re-run focused automated coverage**

```bash
yarn workspace @budgie-at/wallet-capture-tests test
maestro test tests/app-tests/flows/29.apple-pay-capture-settings.flow.yaml
```

Expected: all Wallet capture integration scenarios and setup-page E2E pass.

- [ ] **Step 3: Verify clean native generation and build**

```bash
yarn workspace @budgie-at/app prebuild:dev
xcodebuild -workspace packages/app/ios/budgie.xcworkspace \
  -scheme budgie \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  CODE_SIGNING_ALLOWED=NO build
```

Expected: clean prebuild and BUILD SUCCEEDED. Inspect the built entitlements for the development App Group.

- [ ] **Step 4: Execute the physical-device acceptance checklist**

On an iOS 17+ device with a development build:

1. Open Budgie once and open Apple Pay capture settings.
2. Open Shortcuts and confirm `Capture Apple Pay transaction` appears.
3. Confirm the Account parameter lists current active Budgie accounts.
4. Configure one Wallet card with Run Immediately, Amount, Merchant, optional Card, and a fixed Budgie account.
5. Force-quit Budgie.
6. Complete a low-value contactless Apple Pay purchase.
7. Confirm Budgie does not foreground and Shortcuts reports success.
8. Reopen Budgie and confirm one expense with the correct account, amount, merchant, timestamp, balance effect, and matching rule actions.
9. Confirm the capture file is removed after import.
10. Trigger or inject two nearby identical records and confirm the second appears for review rather than disappearing.
11. Archive the selected account and confirm the automation reports account unavailability or the capture remains recoverable without misposting.

Record the device model, iOS version, Wallet card issuer, and which trigger fields were populated. Do not record card numbers or payment tokens.

- [ ] **Step 5: Commit any final fixes and verification record**

If implementation fixes were required, commit them with their focused verification. If no source changes remain, do not create an empty commit.

```bash
git status --short
git diff --check
```

Expected: clean worktree and no whitespace errors.

---

## Plan self-review

- Every design goal is covered: native background durability (Tasks 3–4), account selection (Tasks 4 and 7), validation/import/rules (Tasks 5–7), duplicate review (Tasks 6 and 8), setup UX (Task 8), localization/testing (Tasks 1–2 and 9–10), and privacy/device verification (Tasks 4 and 10).
- No FinanceKit, PassKit history, Android capture, automation installation, or historical backfill work is included.
- The TypeScript and Swift field names are consistent: `captureId`, `accountId`, `amount`, `merchant`, `cardName`, `capturedAt`, `status`, and `duplicateTransactionId`.
- Native acknowledgement happens only after successful database/rule completion or explicit dismissal.
- Semantic matches are reviewable and are not silently dropped.
