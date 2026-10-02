# Sync Package

Bank integration package for synchronizing accounts and transactions from external banking APIs. Currently supports Monobank with architecture for additional providers.

## Commands

```bash
pnpm build                    # Build package
pnpm ts                       # Native TypeScript 7 check
pnpm lint                     # Oxlint + 13-rule ESLint fallback
```

Integration verification lives in `tests/sync-tests/` and runs from the repository root with `pnpm --filter @budgie-at/sync-tests test`.

## Structure

```
src/
├── index.ts                  # Public exports
├── core/                     # Shared infrastructure
│   ├── client/
│   │   └── base-sync-provider.client.ts    # effect/http transport for SDK-less providers
│   ├── constant/
│   │   └── sync-retry-status-codes.constant.ts
│   ├── enum/
│   │   ├── sync-account-type.enum.ts
│   │   ├── sync-provider.enum.ts
│   │   ├── sync-transaction-type.enum.ts
│   │   └── cashback-type.enum.ts
│   ├── error/
│   │   └── sync-*.error.ts                 # Schema.TaggedError classes
│   ├── interface/
│   │   ├── sync-account.interface.ts
│   │   ├── sync-error.type.ts              # SyncError union
│   │   ├── sync-provider-client.interface.ts
│   │   └── sync-transaction.interface.ts
│   └── service/
│       └── base-sync.service.ts            # Window pagination
└── monobank/                 # Monobank implementation (wire types come from the SDK)
    ├── client/
    │   └── monobank.client.ts
    ├── constant/
    │   └── monobank-*.constant.ts
    ├── mapper/
    │   └── monobank-*.mapper.ts
    └── service/
        └── monosync.service.ts
```

## Architecture

### Provider Pattern

Each bank provider has:

1. **Client** - HTTP API communication
2. **Service** - Sync orchestration
3. **Mappers** - Transform bank-specific to generic interfaces
4. **Constants** - API URLs, rate limits, etc.

```
[App] → [SyncService] → [ProviderClient] → [Provider API]
              ↓
        [Mappers] → [Generic Interfaces]
```

### Supported Providers

| Provider   | Status         | Implementation |
| ---------- | -------------- | -------------- |
| Monobank   | ✅ Implemented | Full support   |
| Privatbank | 📋 Planned     | -              |
| Revolut    | 📋 Planned     | -              |
| Wise       | 📋 Planned     | -              |

### Provider Parser Pattern

For any provider that parses raw input (PDF, XLSX, etc.) into transactions, organize the work as cohesive singleton classes — not loose utilities — under `<provider>/parser/`.

**Class shapes:**

- **`<Provider>Parser`** — main entry. Holds per-call mutable state internally. Calls smaller classes for sub-steps.
- **`<Provider>AccountInfoExtractor`** — single coherent unit (find IBAN, dates, balances). Private finders inside.
- **`<Provider>RowGrouper`** (or analog) — groups raw items into provider-specific row shape. Private comparator inside.
- **`<Provider>ParserState`, `<Provider>TransactionAccumulator`, `<Provider>RowBucket`** — small mutable state classes used internally by the entry classes.

Parsers, extractors, groupers and mappers stay pure synchronous TypeScript. The file client wraps the parse in `Effect.try` and fails with `SyncInvalidResponseError`, so a parser may `throw new Error(message)` internally.

Export each class via a singleton (`export const ersteParser = new ErsteParser()`). Don't export the class itself unless typing demands it. No thin `parse-<provider>-items.util.ts` wrapper.

**Constants ownership:** layout constants used by multiple parser classes go in `<provider>/constant/<provider>.constant.ts`. Constants used by exactly one class live inside it as `private static readonly` (root rule 39).

**Mappers — one class per integration.** A single `<Provider>Mapper` class consolidates all conversions from provider-specific shapes to generic shapes (account, transaction, currency code, anything else) as cohesive methods. Singleton-exported. Single-consumer helpers (e.g. external-id hashing) live as private methods of this class — not as separate files. New conversions become new methods on the same class.

```ts
class ErsteMapper {
    mapAccount(info: ErsteAccountInfoInterface): SyncAccountInterface {
        /* ... */
    }
    mapTransaction(row: ErsteRowInterface, iban: string): SyncTransactionInterface {
        /* ... */
    }
    private generateExternalId(row, iban): string {
        /* ... */
    }
    private fnv1aHash(input: string): string {
        /* ... */
    }
}
export const ersteMapper = new ErsteMapper();
```

**Helpers vs classes (root rule 38):** single-operation pure utilities with no shared state and 2+ callers (`parseErsteAmount`) stay as free functions in `util/`. Single-consumer helpers inline as private methods of the consumer class. Multi-step parsing/extraction work goes into a class.

## Provider Clients

Every client method is an `Effect.fn` field returning `Effect<A, SyncError, R>`.
Callers run it through the app runtime, which provides `HttpClient` via `FetchHttpClient.layer`.

- **Monobank** delegates every request to `@liaugust/monobank-sdk` (its own retry config
  is kept) and wraps each call in `Effect.tryPromise`, mapping SDK errors to `SyncError`.
  `MonobankClient` implements `SyncProviderClientInterface`; `MonobankSyncService` takes it as a constructor argument.
- **Binance** has no usable SDK, so `BinanceSignedClient` extends `BaseSyncProviderClient`,
  the `effect/http` transport in `core/client/`. It owns `Schedule` retry (3 retries, exponential
  from 300 ms, statuses in `retryStatusCodes`, methods in `retryMethods`), a 30 s `Effect.timeout`,
  a response tap for rate-limit headers (`onResponseHeaders`) and the mapping to `SyncError`.
  Responses decode with an Effect `Schema` passed to `fetchJson(schema, endpoint, method)`.
- **Erste** and **Privatbank** are file-based (PDF/XLSX) and make no HTTP calls.
  `ErsteFileClient.parse(items)` and `parsePrivatbankXlsx(buffer)` are Effects failing with
  `SyncInvalidResponseError`; `new PrivatbankFileClient(rows)` takes the parsed rows.

Prefer a maintained SDK for a new HTTP-backed provider. Absent one, extend `BaseSyncProviderClient`
and supply `provider`, `baseUrl` and `headers`.

### Errors

One tagged union, `SyncError`, of `Schema.TaggedError` classes in `core/error/`. Every error carries
`provider` and `message`. Branch with `Effect.catchTag` or on `error._tag`.

| Error                      | Source                                                        | Extra fields |
| -------------------------- | ------------------------------------------------------------- | ------------ |
| `SyncUnauthorizedError`    | HTTP 401/403, Monobank 401                                    |              |
| `SyncRateLimitedError`     | HTTP 429                                                      |              |
| `SyncDeferredError`        | Binance run deadline reached or weight cool-down past it      |              |
| `SyncNetworkError`         | transport failure, timeout, other HTTP statuses               |              |
| `SyncInvalidResponseError` | HTTP 400, schema decode failure, unparsable file, bad account | `apiCode?`   |

`SyncInvalidResponseError` is meaningful: `BaseSyncService` treats it as an empty batch rather than a
sync failure, and Binance treats `apiCode -1121` (unknown symbol) as an empty trade page.

Monobank retry stays in the SDK, scoped to `SYNC_RETRY_STATUS_CODES` (`[408, 500, 502, 503, 504]`).
`429` is deliberately excluded: Monobank documents these endpoints at one request per 60 seconds, so a
rate-limited response means the minute's quota is already spent. `retry-policy.test.ts` pins this.

## Base Sync Service

`BaseSyncService(client, options)` pages a `SyncProviderClientInterface` in windows of
`options.maxPeriodSeconds`:

- `syncTransactionsForward(accountId, from)` fetches new transactions from the last sync date.
- `syncTransactionsBackward(accountId, to, firstEmptyFromInStreak, limitAt)` walks history backward until
  the history limit or the dormancy boundary.

Both return `Effect<SyncBatchResultInterface, SyncError>`.

## Monobank Implementation

`MonobankClient(token)` holds a `MonobankPersonalClient` and caches client-info per instance, since
accounts and jars both read from it. Methods: `getAccounts()`, `getJars()`, `getTransactions(accountId, from, to?)`.

### Constants

The SDK owns the base URL, so only app-level constants remain here:

```typescript
export const MONOBANK_AUTH_URL = 'https://api.monobank.ua/personal/auth';

// Rate limits
export const MONOBANK_RATE_LIMIT_MS = 60_000; // 1 request per minute
export const MONOBANK_MAX_PERIOD_SECONDS = 2_682_000; // 31 days + 1 hour, the API maximum

// Data conversion
export const MONOBANK_BALANCE_DIVISOR = 100; // Amount in kopecks
```

### Mappers

Transform SDK-validated Monobank types into generic interfaces. The SDK is the
single source of truth for wire shapes — `Account`, `Jar`, `ClientInfo`,
`StatementItem`, `AccountType`, `CashbackType` — so this package defines no
Monobank API interfaces or enums of its own:

```typescript
// monobank/mapper/monobank-account.mapper.ts
import type { Account } from '@liaugust/monobank-sdk';

export const monobankAccountMapper = (account: Account): SyncAccountInterface => ({
    id: account.id,
    type: monobankAccountTypeMapper(account.type),
    currencyCode: monobankCurrencyCodeMapper(account.currencyCode),
    balance: account.balance / MONOBANK_BALANCE_DIVISOR
    // ...
});
```

Integration fixtures in `tests/sync-tests` build SDK types directly, so a
schema change upstream surfaces as a compile error in the harness.

### Rate Limiting

Monobank allows 1 request per minute per endpoint. Handle in app layer:

```typescript
// In app: monosync.service.ts
const MONOBANK_RATE_LIMIT_MS = 60_000;

// Add delay between API calls
await sleep(MONOBANK_RATE_LIMIT_MS);
```

## Generic Interfaces

### SyncAccountInterface

```typescript
interface SyncAccountInterface {
    id: string;
    type: SyncAccountTypeEnum;
    currencyCode: number;
    balance: number;
    creditLimit?: number;
    cashbackType?: CashbackTypeEnum;
    maskedPan?: string[];
    iban?: string;
}
```

### SyncTransactionInterface

```typescript
interface SyncTransactionInterface {
    id: string;
    time: Date;
    description: string;
    mcc: number;
    amount: number;
    operationAmount: number;
    currencyCode: number;
    commissionRate: number;
    cashbackAmount: number;
    balance: number;
    hold: boolean;
}
```

### SyncProviderClientInterface

```typescript
interface SyncProviderClientInterface {
    getAccounts(): Effect.Effect<SyncAccountInterface[], SyncError>;
    getTransactions(accountId: string, from: number, to?: number): Effect.Effect<SyncTransactionInterface[], SyncError>;
}
```

## Adding New Providers

### 1. Create Provider Folder

```
src/
└── [provider]/
    ├── client/
    │   └── [provider].client.ts
    ├── constant/
    │   └── [provider]-*.constant.ts
    ├── enum/
    │   └── [provider]-*.enum.ts
    ├── interface/
    │   └── [provider]-*-api.interface.ts
    ├── mapper/
    │   └── [provider]-*.mapper.ts
    └── service/
        └── [provider]-sync.service.ts
```

### 2. Implement Client

Satisfy `SyncProviderClientInterface` with `Effect.fn` fields. With an SDK, hold the SDK client as a
private field and wrap its calls in `Effect.tryPromise`, mapping failures to `SyncError`; without one,
extend `BaseSyncProviderClient`.

### 3. Create Mappers

Map provider-specific types to generic interfaces.

### 4. Export from index.ts

```typescript
export { NewProviderClient } from './[provider]/client/[provider].client';
export { NewProviderSyncService } from './[provider]/service/[provider]-sync.service';
```

## Testing

### Test Location

Per root rule 27 this package hosts no unit tests. Coverage lives in
`tests/sync-tests`, which drives the real app sync services against a
stubbed network:

```bash
pnpm --filter @budgie-at/sync-tests test
```

> `tests/*-tests` resolve `@budgie/*` through the workspace symlink to **`dist/esm`**,
> not `src`. Run `pnpm --filter @budgie/sync build` after editing this package
> or the suite silently measures the previous build. Sourcemaps make stale `dist`
> stack traces look like source runs.

### Mocking API Calls

msw intercepts at the fetch layer, so the SDK's own transport is exercised end to end:

```typescript
mockServer.use(http.get('https://api.monobank.ua/personal/client-info', () => HttpResponse.json(clientInfo)));
```

Fixtures come from `buildMonobank` in the harness and are typed as SDK types.

## Dependencies

| Package                  | Purpose                                                  |
| ------------------------ | -------------------------------------------------------- |
| `@liaugust/monobank-sdk` | Monobank Personal API client, schemas, and error classes |
| `date-fns`               | Date manipulation                                        |
| `xlsx`                   | Privatbank statement parsing                             |
| `@rnw-community/shared`  | Type guards                                              |
| `effect`                 | Effects, `effect/http` transport, Schema, tagged errors  |
| `@noble/hashes`          | Binance HMAC signing                                     |

## Export Configuration

ESM-only package:

```json
{
    "exports": {
        ".": {
            "types": "./dist/esm/index.d.ts",
            "import": "./dist/esm/index.js",
            "default": "./dist/esm/index.js",
            "react-native": "./dist/esm/index.js"
        }
    }
}
```

## Known Issues

1. **Monobank and Binance are the only API integrations** - Erste and Privatbank
   are file-based, and other providers in the enum are placeholders.

`ClientInfo.jars` is optional (`readonly Jar[] | undefined`), because Monobank
omits it for some tokens. Always read it through a guard, as `getJars()` does.

## Error Recovery

For failed syncs, the app tracks:

- `errorCount` - Number of consecutive failures
- `lastError` - Last error message
- `lastSyncedAt` - Last successful sync timestamp

Implement exponential backoff in app layer based on error count.
