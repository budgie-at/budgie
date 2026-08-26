# Bank-Sync Package

Bank integration package for synchronizing accounts and transactions from external banking APIs. Currently supports Monobank with architecture for additional providers.

## Commands

```bash
pnpm build                    # Build package
pnpm ts                       # Native TypeScript 7 check
pnpm lint                     # Oxlint + 13-rule ESLint fallback
```

Integration verification lives in `tests/bank-sync-tests/` and runs from the repository root with `pnpm --filter @budgie-at/bank-sync-tests test`.

## Structure

```
src/
├── index.ts                  # Public exports
├── core/                     # Shared infrastructure
│   ├── client/
│   ├── enum/
│   │   ├── bank-account-type.enum.ts
│   │   ├── bank-provider.enum.ts
│   │   ├── bank-sync-error-code.enum.ts
│   │   ├── bank-transaction-type.enum.ts
│   │   └── cashback-type.enum.ts
│   ├── error/
│   │   └── bank-sync.error.ts              # Error class with factory methods
│   ├── interface/
│   │   ├── bank-account.interface.ts
│   │   ├── bank-client-info.interface.ts
│   │   ├── bank-provider-client.interface.ts
│   │   ├── bank-sync-result.type.ts
│   │   └── bank-transaction.interface.ts
│   └── service/
│       └── base-bank-sync.service.ts       # Abstract sync service
└── monobank/                 # Monobank implementation (wire types come from the SDK)
    ├── client/
    │   └── monobank.client.ts
    ├── constant/
    │   └── monobank-*.constant.ts
    ├── mapper/
    │   └── monobank-*.mapper.ts
    └── service/
        └── monobank-sync.service.ts
```

## Architecture

### Provider Pattern

Each bank provider has:

1. **Client** - HTTP API communication
2. **Service** - Sync orchestration
3. **Mappers** - Transform bank-specific to generic interfaces
4. **Constants** - API URLs, rate limits, etc.

```
[App] → [BankSyncService] → [ProviderClient] → [Bank API]
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

- **`<Provider>Parser`** — main entry. `@Log` on `parse()`. Holds per-call mutable state internally. Calls smaller classes for sub-steps.
- **`<Provider>AccountInfoExtractor`** — single coherent unit (find IBAN, dates, balances). `@Log` on `extract()`. Private finders inside.
- **`<Provider>RowGrouper`** (or analog) — groups raw items into provider-specific row shape. `@Log` on `group()`. Private comparator inside.
- **`<Provider>ParserState`, `<Provider>TransactionAccumulator`, `<Provider>RowBucket`** — small mutable state classes used internally by the entry classes. No `@Log` (called many times per parse).

Export each class via a singleton (`export const ersteParser = new ErsteParser()`). Don't export the class itself unless typing demands it. No thin `parse-<provider>-items.util.ts` wrapper.

**Constants ownership:** layout constants used by multiple parser classes go in `<provider>/constant/<provider>.constant.ts`. Constants used by exactly one class live inside it as `private static readonly` (root rule 39).

**Mappers — one class per integration.** A single `<Provider>Mapper` class consolidates all conversions from provider-specific shapes to generic shapes (account, transaction, currency code, anything else) as cohesive methods. Singleton-exported. Single-consumer helpers (e.g. external-id hashing) live as private methods of this class — not as separate files. New conversions become new methods on the same class.

```ts
class ErsteMapper {
    mapAccount(info: ErsteAccountInfoInterface): BankAccountInterface {
        /* ... */
    }
    mapTransaction(row: ErsteRowInterface, iban: string): BankTransactionInterface {
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

There is no shared HTTP base class. Each provider client implements
`BankProviderClientInterface` directly and owns its transport:

- **Monobank** delegates every request to `@liaugust/monobank-sdk`, which supplies
  the fetch transport, runtime response validation, and typed error classes.
- **Erste** and **Privatbank** are file-based (PDF/XLSX) and make no HTTP calls.

A new HTTP-backed provider should prefer a maintained SDK for that bank. Only
hand-roll a transport when none exists, and keep it inside that provider's
`client/` folder rather than reintroducing a shared abstract client.

### Error Handling

All API calls return `BankSyncResultInterface<T>`:

```typescript
interface BankSyncResultInterface<T> {
    success: boolean;
    data?: T;
    error?: BankSyncError;
}

// Usage
const result = await client.getAccounts(token);
if (!result.success) {
    // Handle result.error
    return;
}
// Use result.data
```

## BankSyncError

### Error Codes

```typescript
enum BankSyncErrorCodeEnum {
    UNAUTHORIZED = 'UNAUTHORIZED',
    RATE_LIMITED = 'RATE_LIMITED',
    NETWORK_ERROR = 'NETWORK_ERROR',
    INVALID_TOKEN = 'INVALID_TOKEN',
    TOKEN_EXPIRED = 'TOKEN_EXPIRED',
    ACCOUNT_NOT_FOUND = 'ACCOUNT_NOT_FOUND',
    INVALID_RESPONSE = 'INVALID_RESPONSE',
    UNSUPPORTED_OPERATION = 'UNSUPPORTED_OPERATION',
    UNKNOWN = 'UNKNOWN'
}
```

### Factory Methods

Use static factory methods to create errors:

```typescript
// Creating errors
throw BankSyncError.unauthorized('Invalid token');
throw BankSyncError.rateLimited('Too many requests');
throw BankSyncError.networkError('Connection timeout');
throw BankSyncError.invalidResponse('Unexpected API response');

// Translating monobank-sdk exceptions at the client boundary
try {
    return await this.personalClient.client.getInfo();
} catch (error) {
    if (error instanceof MonobankApiError) {
        // branch on error.status
    }
    if (error instanceof MonobankNetworkError) {
        return { success: false, error: BankSyncError.networkError(provider, error) };
    }
    // ...
}
```

### Error Mapping

`@liaugust/monobank-sdk` throws instead of returning results, so `MonobankClient`
converts each SDK error class into a `BankSyncError`:

| SDK error                         | Condition                        | Error Code       |
| --------------------------------- | -------------------------------- | ---------------- |
| `MonobankApiError`                | status 401                       | UNAUTHORIZED     |
| `MonobankApiError`                | status 429                       | RATE_LIMITED     |
| `MonobankApiError`                | status 400                       | INVALID_RESPONSE |
| `MonobankApiError`                | any other status                 | UNKNOWN          |
| `MonobankNetworkError`            | fetch failure, timeout, abort    | NETWORK_ERROR    |
| `MonobankResponseValidationError` | payload failed schema validation | INVALID_RESPONSE |
| `MonobankValidationError`         | bad input caught before fetch    | UNKNOWN          |

`INVALID_RESPONSE` is meaningful: `BaseBankSyncService.fetchTransactions` treats it
as an empty batch rather than a sync failure.

SDK retry is intentionally left unconfigured. Its retryable status set is fixed and
includes 429, which is counterproductive against Monobank's 1-request-per-60-seconds
limit. See [monobank-typescript-sdk#17](https://github.com/liaugust/monobank-typescript-sdk/issues/17).

## Base Bank Sync Service

### Abstract Class

Extend for provider-specific sync logic:

```typescript
export abstract class BaseBankSyncService<TClient extends BankProviderClientInterface> {
    constructor(protected readonly client: TClient) {}

    async syncAccounts(token: string): Promise<BankSyncResultInterface<BankAccountInterface[]>> {
        const result = await this.client.getAccounts(token);
        if (!result.success) return result;
        return { success: true, data: result.data };
    }

    async syncTransactionsForward(
        token: string,
        accountId: string,
        fromDate: Date
    ): Promise<BankSyncResultInterface<BankTransactionInterface[]>> {
        // Forward pagination logic
    }

    async syncTransactionsBackward(
        token: string,
        accountId: string,
        toDate: Date
    ): Promise<BankSyncResultInterface<BankTransactionInterface[]>> {
        // Backward pagination logic
    }
}
```

### Pagination

Handles both forward and backward sync:

- **Forward**: Fetch new transactions from last sync date
- **Backward**: Fetch historical transactions before first known

```typescript
// Forward sync (new transactions)
const result = await syncService.syncTransactionsForward(token, accountId, lastSyncDate);

// Backward sync (historical)
const result = await syncService.syncTransactionsBackward(token, accountId, earliestKnownDate);
```

## Monobank Implementation

### Client

Wraps `MonobankPersonalClient` from `@liaugust/monobank-sdk` and translates its
exceptions into `BankSyncResultInterface`. Client-info is fetched once and cached
per instance, since accounts and jars both read from it.

```typescript
export class MonobankClient implements BankProviderClientInterface {
    private readonly personalClient: MonobankPersonalClient;

    constructor(token: string) {
        this.personalClient = new MonobankPersonalClient({ timeoutMs: MonobankClient.TIMEOUT_MS, token });
    }

    async getTransactions(accountId: string, from: number, to?: number): Promise<BankSyncResultInterface<BankTransactionInterface[]>> {
        try {
            const statements = await this.personalClient.statements.get({ account: accountId, from, to: to ?? getUnixTime(new Date()) });

            return { success: true, data: statements.map(statement => monobankTransactionMapper(statement, accountId)) };
        } catch (error) {
            return this.toFailure(error);
        }
    }
}
```

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

export const monobankAccountMapper = (account: Account): BankAccountInterface => ({
    id: account.id,
    type: monobankAccountTypeMapper(account.type),
    currencyCode: monobankCurrencyCodeMapper(account.currencyCode),
    balance: account.balance / MONOBANK_BALANCE_DIVISOR
    // ...
});
```

Integration fixtures in `tests/bank-sync-tests` build SDK types directly, so a
schema change upstream surfaces as a compile error in the harness.

### Rate Limiting

Monobank allows 1 request per minute per endpoint. Handle in app layer:

```typescript
// In app: monobank-sync.service.ts
const MONOBANK_RATE_LIMIT_MS = 60_000;

// Add delay between API calls
await sleep(MONOBANK_RATE_LIMIT_MS);
```

## Generic Interfaces

### BankAccountInterface

```typescript
interface BankAccountInterface {
    id: string;
    type: BankAccountTypeEnum;
    currencyCode: number;
    balance: number;
    creditLimit?: number;
    cashbackType?: CashbackTypeEnum;
    maskedPan?: string[];
    iban?: string;
}
```

### BankTransactionInterface

```typescript
interface BankTransactionInterface {
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

### BankProviderClientInterface

```typescript
interface BankProviderClientInterface {
    getClientInfo(token: string): Promise<BankSyncResultInterface<BankClientInfoInterface>>;
    getAccounts(token: string): Promise<BankSyncResultInterface<BankAccountInterface[]>>;
    getTransactions(token: string, accountId: string, from: Date, to: Date): Promise<BankSyncResultInterface<BankTransactionInterface[]>>;
    setWebhook?(token: string, url: string): Promise<BankSyncResultInterface<void>>;
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

Implement `BankProviderClientInterface` and hold the provider's SDK (or, absent
one, its own transport) as a private field:

```typescript
export class NewProviderClient implements BankProviderClientInterface {
    private readonly providerClient: NewProviderSdkClient;

    constructor(token: string) {
        this.providerClient = new NewProviderSdkClient({ token, timeoutMs: 30_000 });
    }

    async getClientInfo(token: string): Promise<BankSyncResultInterface<BankClientInfoInterface>> {
        // Provider-specific implementation
    }

    async getAccounts(token: string): Promise<BankSyncResultInterface<BankAccountInterface[]>> {
        // Provider-specific implementation
    }

    async getTransactions(...): Promise<BankSyncResultInterface<BankTransactionInterface[]>> {
        // Provider-specific implementation
    }
}
```

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
`tests/bank-sync-tests`, which drives the real app sync services against a
stubbed network:

```bash
pnpm --filter @budgie-at/bank-sync-tests test
```

> `tests/*-tests` resolve `@budgie/*` through the workspace symlink to **`dist/esm`**,
> not `src`. Run `pnpm --filter @budgie/bank-sync build` after editing this package
> or the suite silently measures the previous build. Sourcemaps make stale `dist`
> stack traces look like source runs.

### Mocking API Calls

msw intercepts at the fetch layer, so the SDK's own transport is exercised end to end:

```typescript
monobankServer.use(http.get('https://api.monobank.ua/personal/client-info', () => HttpResponse.json(clientInfo)));
```

Fixtures come from `buildMonobank` in the harness and are typed as SDK types.

## Dependencies

| Package                  | Purpose                                                  |
| ------------------------ | -------------------------------------------------------- |
| `@liaugust/monobank-sdk` | Monobank Personal API client, schemas, and error classes |
| `date-fns`               | Date manipulation                                        |
| `xlsx`                   | Privatbank statement parsing                             |
| `@rnw-community/shared`  | Type guards                                              |

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

1. **No retry on 5xx** - see the retry note under Error Mapping.
2. **A second zod copy is bundled** - the SDK depends on `zod@^4.4.3` while this
   monorepo standardises on `4.1.12`, so the SDK gets a nested copy and `zod/mini`
   ships twice. Bumping zod repo-wide to `>=4.4.3` would deduplicate it.
3. **Only Monobank has an API integration** - Erste and Privatbank are file-based,
   and other providers in the enum are placeholders.

`ClientInfo.jars` is optional (`readonly Jar[] | undefined`), because Monobank
omits it for some tokens. Always read it through a guard, as `getJars()` does.

## Error Recovery

For failed syncs, the app tracks:

- `errorCount` - Number of consecutive failures
- `lastError` - Last error message
- `lastSyncedAt` - Last successful sync timestamp

Implement exponential backoff in app layer based on error count.
