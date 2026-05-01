# Bank-Sync Package

Bank integration package for synchronizing accounts and transactions from external banking APIs. Currently supports Monobank with architecture for additional providers.

## Commands

```bash
yarn build                    # Build package
yarn test                     # Run Jest tests
yarn ts                       # TypeScript check
yarn lint                     # ESLint check
```

## Structure

```
src/
├── index.ts                  # Public exports
├── core/                     # Shared infrastructure
│   ├── client/
│   │   └── base-bank-provider.client.ts    # Abstract HTTP client
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
└── monobank/                 # Monobank implementation
    ├── client/
    │   └── monobank.client.ts
    ├── constant/
    │   └── monobank-*.constant.ts
    ├── enum/
    │   └── monobank-*.enum.ts
    ├── interface/
    │   └── monobank-*-api.interface.ts
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

## Base Bank Provider Client

### Abstract Class

Extend `BaseBankProviderClient` for new providers:

```typescript
export abstract class BaseBankProviderClient {
    protected readonly httpClient: KyInstance;

    constructor(options: BaseBankProviderClientOptions) {
        this.httpClient = ky.create({
            prefixUrl: options.baseUrl,
            retry: { limit: options.retryLimit ?? 3 },
            timeout: options.timeout ?? 30000
        });
    }

    protected async request<T>(path: string, options?: Options): Promise<BankSyncResultInterface<T>> {
        // Handles errors, retries, and result wrapping
    }
}
```

### HTTP Client (ky)

Uses `ky` library with built-in retry support:

```typescript
const response = await this.httpClient.get('endpoint', {
    headers: { 'X-Token': token },
    searchParams: { from, to }
});
```

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

// In try-catch
try {
    const response = await fetch(...);
} catch (error) {
    if (error instanceof HTTPError) {
        if (error.response.status === 401) {
            return { success: false, error: BankSyncError.unauthorized() };
        }
        if (error.response.status === 429) {
            return { success: false, error: BankSyncError.rateLimited() };
        }
    }
    return { success: false, error: BankSyncError.networkError() };
}
```

### HTTP Status Mapping

| Status  | Error Code       |
| ------- | ---------------- |
| 401     | UNAUTHORIZED     |
| 429     | RATE_LIMITED     |
| 400     | INVALID_RESPONSE |
| Timeout | NETWORK_ERROR    |

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

```typescript
export class MonobankClient extends BaseBankProviderClient {
    async getClientInfo(token: string): Promise<BankSyncResultInterface<BankClientInfoInterface>> {
        return this.request('/personal/client-info', {
            headers: { 'X-Token': token }
        });
    }

    async getAccounts(token: string): Promise<BankSyncResultInterface<BankAccountInterface[]>> {
        const result = await this.getClientInfo(token);
        if (!result.success) return result;
        return {
            success: true,
            data: result.data.accounts.map(monobankAccountMapper)
        };
    }

    async getTransactions(
        token: string,
        accountId: string,
        from: Date,
        to: Date
    ): Promise<BankSyncResultInterface<BankTransactionInterface[]>> {
        return this.request(`/personal/statement/${accountId}/${fromTs}/${toTs}`, {
            headers: { 'X-Token': token }
        });
    }
}
```

### Constants

```typescript
// API configuration
export const MONOBANK_API_BASE_URL = 'https://api.monobank.ua';
export const MONOBANK_AUTH_URL = 'https://api.monobank.ua/personal/auth';

// Rate limits
export const MONOBANK_RATE_LIMIT_MS = 60_000; // 1 request per minute
export const MONOBANK_MAX_PERIOD_SECONDS = 2_678_400; // 31 days max range

// Data conversion
export const MONOBANK_BALANCE_DIVISOR = 100; // Amount in kopecks
```

### Mappers

Transform Monobank-specific data to generic interfaces:

```typescript
// monobank/mapper/monobank-account.mapper.ts
export const monobankAccountMapper = (account: MonobankAccountApiInterface): BankAccountInterface => ({
    id: account.id,
    type: monobankAccountTypeMapper(account.type),
    currencyCode: monobankCurrencyCodeMapper(account.currencyCode),
    balance: account.balance / MONOBANK_BALANCE_DIVISOR
    // ...
});
```

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

```typescript
export class NewProviderClient extends BaseBankProviderClient implements BankProviderClientInterface {
    constructor() {
        super({
            baseUrl: NEW_PROVIDER_API_BASE_URL,
            retryLimit: 3,
            timeout: 30000,
        });
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

Tests should be in the same directory as source:

```
client/
├── monobank.client.ts
└── monobank.client.spec.ts
```

### Coverage Thresholds

```javascript
// jest.config.js
coverageThreshold: {
    global: {
        statements: 69,
        branches: 39,
        lines: 66,
        functions: 56
    }
}
```

### Mocking API Calls

```typescript
import { MonobankClient } from './monobank.client';

jest.mock('ky');

describe('MonobankClient', () => {
    it('should fetch accounts', async () => {
        // Mock ky response
        // Assert mapper is called correctly
    });
});
```

## Dependencies

| Package                 | Purpose                        |
| ----------------------- | ------------------------------ |
| `ky`                    | HTTP client with retry support |
| `date-fns`              | Date manipulation              |
| `@rnw-community/shared` | Type guards                    |

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

1. **Jest config typo** - `displayName: 'banc-sync'` should be `bank-sync`
2. **Only Monobank implemented** - Other providers in enum are placeholders

## Error Recovery

For failed syncs, the app tracks:

- `errorCount` - Number of consecutive failures
- `lastError` - Last error message
- `lastSyncedAt` - Last successful sync timestamp

Implement exponential backoff in app layer based on error count.
