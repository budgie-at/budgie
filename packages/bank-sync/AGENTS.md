# Bank-Sync Package

Bank integration package for syncing accounts and transactions. Currently supports Monobank.

## Commands

```bash
yarn build    # Build package
yarn test     # Run Jest tests
```

## Structure

```
src/
├── core/                 # Shared infrastructure
│   ├── client/           # BaseBankProviderClient (abstract HTTP client)
│   ├── enum/             # BankAccountType, BankProvider, BankSyncErrorCode
│   ├── error/            # BankSyncError class
│   ├── interface/        # Generic interfaces (BankAccount, BankTransaction)
│   └── service/          # BaseBankSyncService (abstract sync service)
└── monobank/             # Monobank implementation
    ├── client/           # MonobankClient
    ├── constant/         # API URLs, rate limits
    ├── mapper/           # Transform Monobank → generic interfaces
    └── service/          # MonobankSyncService
```

## Provider Pattern

Each bank provider has: Client → Service → Mappers → Constants

```
[App] → [SyncService] → [ProviderClient] → [Bank API]
                ↓
          [Mappers] → [Generic Interfaces]
```

## Error Handling

All API calls return `BankSyncResultInterface<T>`:

```typescript
const result = await client.getAccounts(token);
if (!result.success) {
    // Handle result.error
    return;
}
// Use result.data
```

### Error Factory Methods

```typescript
throw BankSyncError.unauthorized('Invalid token');
throw BankSyncError.rateLimited('Too many requests');
throw BankSyncError.networkError('Connection timeout');
```

### HTTP Status Mapping

| Status | Error Code |
|--------|------------|
| 401 | UNAUTHORIZED |
| 429 | RATE_LIMITED |
| 400 | INVALID_RESPONSE |
| Timeout | NETWORK_ERROR |

## Adding New Providers

1. Create folder: `src/[provider]/`
2. Implement client extending `BaseBankProviderClient`
3. Create mappers to transform to generic interfaces
4. Export from `index.ts`

```typescript
export class NewProviderClient extends BaseBankProviderClient 
    implements BankProviderClientInterface {
    
    async getAccounts(token: string): Promise<BankSyncResultInterface<BankAccountInterface[]>> {
        // Provider-specific implementation
    }
}
```

## Monobank Specifics

- Rate limit: 1 request per minute per endpoint
- Max period: 31 days per request
- Amounts in kopecks (divide by 100)
