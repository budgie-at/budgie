# Bank Sync Package Audit Plan

Package: `packages/bank-sync`

## Summary

The bank-sync package is compact and mostly cohesive. It owns provider clients, provider-specific parsers, mappers, and the core batch sync service. The highest-value cleanup is guard-rule alignment and making provider policies explicit where they differ.

Current pressure points:

- 71 source TypeScript files.
- 8 lint-disable markers.
- 11 focused canonical guard-pattern candidates.
- Known lint warning in `erste-card-merchant.parser.ts`.
- Provider-specific parsing relies on regex, tokenization, and stateful PDF row accumulation.
- Three integrations (Erste, Monobank, Privatbank) have divergent mapper and parser class shapes; only Erste follows the prescribed pattern.
- `ky` is not used as `ky.create()` instance; HTTP config is re-assembled per call, causing trailing-slash drift between Monobank URL constants.
- Manual Unix time math (`Math.floor(date.getTime() / 1000)`) scattered across three files instead of date-fns `getUnixTime`/`fromUnixTime`.
- Monobank HTTP calls are double-logged: `syncLogger` calls wrap `fetchJson` which already emits HTTP lifecycle logs.
- `xlsx ^0.18.5` (SheetJS community edition) has known prototype-pollution CVEs in the 0.18.x line.

## P0: Parser Guards Need Rule Alignment Without Damaging Domain Clarity

The known lint warning in `erste-card-merchant.parser.ts` is a manual null check on `cityStartIndex`. The parser is otherwise cohesive.

Plan:

1. Replace manual guard checks with canonical `isDefined` / `!isDefined` where lint already points at them.
2. Keep parser state classes bank-specific.
3. Keep regex constants private static fields on parser classes.
4. Add fixture coverage only for real bank statement edge cases.

## P1: Base Sync Delay Utility May Be Over-Accommodating

`BaseBankSyncService.delay` is a protected helper wrapping `setTimeout`. The current source scan found only the method definition and no call sites, so it is dead ceremony unless a near-term provider refactor needs throttling.

Plan:

1. Remove it if the no-consumer scan still holds when the cleanup PR starts.
2. Inline it if one provider adds a real throttle before that PR lands.
3. Keep shared only if multiple provider services need throttling.

## P1: Error Shapes Should Stay Provider-Agnostic

Provider clients return structured success/error results. The core service converts invalid response errors into empty transaction batches, while other errors throw.

Plan:

1. Review whether invalid response should be a silent empty batch for every provider.
2. If provider-specific, move that policy to provider service configuration.
3. Keep external API errors typed through `BankSyncErrorCodeEnum`.

## P1: Provider Mappers Should Keep Domain-Specific Hash Exceptions Isolated

Some mappers use FNV/hash constants and bitwise operations. Those exceptions are legitimate, but should not spread into generic code.

Plan:

1. Keep hash constants and bitwise suppressions inside provider mapper utilities.
2. Keep mapper output interfaces readonly and provider-prefixed.
3. Avoid shared mapper abstractions unless two providers genuinely share the same transformation.

## P1: Mapper and Parser Class Shape Diverges Across Integrations

The bank-sync CLAUDE.md and the prescribed provider pattern mandate one `<Provider>Mapper` class and one `<Provider>Parser` class per integration, singleton-exported, with all conversions as cohesive methods and single-consumer helpers inlined as private methods. Only Erste follows this:

- `packages/bank-sync/src/erste/mapper/erste.mapper.ts` — one `ErsteMapper` class; correct.
- `packages/bank-sync/src/monobank/mapper/` — five standalone free-function files (`monobank-account.mapper.ts`, `monobank-transaction.mapper.ts`, `monobank-account-type.mapper.ts`, `monobank-cashback-type.mapper.ts`, `monobank-currency-code.mapper.ts`); no class.
- `packages/bank-sync/src/privatbank/mapper/privatbank-account.mapper.ts` and `privatbank-transaction.mapper.ts` — free functions; no class.
- `packages/bank-sync/src/privatbank/util/parse-privatbank-xlsx.util.ts` — free-function pile; four private helpers (`createParseError`, `parsePrivatbankDate`, `extractDataRows`, `mapRawRowToPrivatbankRow`) and one entry point. No `PrivatbankParser` class.
- `packages/bank-sync/src/core/client/base-bank-provider.client.ts` (`ErsteFileClient`) — keeps `parsedData` as nullable mutable state requiring two-step `parse()` then `getAccounts()/getTransactions()`. Privatbank file client parses eagerly in constructor. Two divergent lifecycles across sibling integrations.

Plan:

1. Build `MonobankMapper` class; collapse all five monobank mapper function files into singleton class methods. Singleton-export as `export const monobankMapper = new MonobankMapper()`.
2. Build `PrivatbankMapper` class; absorb `privatbank-account.mapper.ts`, `privatbank-transaction.mapper.ts`, `extract-card-ending.util.ts`, and the external-id generation into private methods. Remove `PrivatbankExternalIdInputInterface` (dead indirection — single consumer, single-field redundancy per rules 44/51).
3. Build `PrivatbankParser` class following the Erste class hierarchy pattern (rules 22, 42); absorb `parse-privatbank-xlsx.util.ts`. Singleton-export.
4. Align file-client lifecycles: prefer eager parsing in constructor (Privatbank model) as it is simpler than nullable deferred state.
5. Remove the original free-function files after the class absorbs them; net result is fewer files.

## P1: `fnv1aHash` Is Duplicated Across Two Providers

Identical implementation exists at `packages/bank-sync/src/erste/mapper/erste.mapper.ts:87–115` (suppressed with `/* jscpd:ignore-start */`) and `packages/bank-sync/src/privatbank/util/generate-privatbank-external-id.util.ts:9–36`. Two consumers satisfies the rule 51 extraction threshold.

Plan:

1. Extract `fnv1aHash` to `packages/bank-sync/src/core/util/fnv1a-hash.util.ts`.
2. Import it into `ErsteMapper` (as a private method call or module-level util — 2 consumers makes it genuinely shared) and into `PrivatbankMapper` (after the mapper class is built per the section above).
3. Remove `/* jscpd:ignore-start */` fence from `ErsteMapper`.
4. Delete `generate-privatbank-external-id.util.ts` once its logic is absorbed into `PrivatbankMapper`.

## P1: Module-Level Constants and Free Functions Belong on Their Owning Classes

Multiple files declare module-level constants and free functions that are consumed by exactly one class in the same file or one file in the same folder, violating rules 39 and 43.

Evidence:

- `packages/bank-sync/src/privatbank/mapper/privatbank-transaction.mapper.ts:12` — `MILLISECONDS_TO_SECONDS_DIVISOR = 1000` module-level. Erste keeps an equivalent constant correctly as `private static readonly` on the class.
- `packages/bank-sync/src/privatbank/mapper/privatbank-transaction.mapper.ts:14` — `getTransactionType` module-level free function; single consumer two lines below (rule 43).
- `packages/bank-sync/src/privatbank/mapper/privatbank-account.mapper.ts:11` — `mapCardToAccount` module-level free function; single consumer in same file (rule 43).
- `packages/bank-sync/src/core/client/base-bank-provider.client.ts:14–33` — 8 HTTP status constants + 2 retry defaults at module level; all consumed only by `BaseBankProviderClient` (rule 43).
- `packages/bank-sync/src/core/service/base-bank-sync.service.ts:14` — `MAX_TRANSACTIONS_PER_REQUEST = 500` module-level; single consumer.
- `packages/bank-sync/src/erste/parser/erste-account-info.extractor.ts:15–19` — five regex/label constants module-level; single consumer. `NEW_BALANCE_INLINE_PREFIX = 'Neuer Kontostand'` is also duplicated as a separate `private static readonly` in `erste.parser.ts:25` — same string, two declaration sites.
- `packages/bank-sync/src/erste/parser/erste-transaction-accumulator.ts:9` — `type MerchantInfo = Partial<Pick<...>>` module-level type alias used only by one private method. Inline as the return-type annotation directly on that method.

Plan:

1. After the mapper class consolidation above, these constants and free functions become private methods / `private static readonly` fields automatically — handle as part of that refactor.
2. For `BaseBankProviderClient` and `BaseBankSyncService` (standalone classes not being rebuilt): promote 8 HTTP status constants + 2 retry defaults to `private static readonly` on `BaseBankProviderClient`; promote `MAX_TRANSACTIONS_PER_REQUEST` to `private static readonly` on `BaseBankSyncService`.
3. Promote the five regex/label constants in `erste-account-info.extractor.ts` to `private static readonly` fields on `ErsteAccountInfoExtractor`; remove the duplicate `NEW_BALANCE_INLINE_PREFIX` declaration from `erste.parser.ts` (use the canonical one on `ErsteAccountInfoExtractor` or hoist to `erste/constant/erste.constant.ts` if both classes need it).
4. Inline `type MerchantInfo` in `erste-transaction-accumulator.ts:9` as the method return-type annotation; remove the module-level alias.

## P1: Single-Consumer Util Files Should Be Inlined

Two privatbank util files have exactly one consumer each, making them single-consumer artifacts per rules 38/42/51.

Evidence:

- `packages/bank-sync/src/privatbank/util/extract-card-ending.util.ts:3` — single consumer `privatbank-account.mapper.ts`.
- `packages/bank-sync/src/privatbank/util/generate-privatbank-external-id.util.ts:40` — single consumer `privatbank-transaction.mapper.ts`; also defines `PrivatbankExternalIdInputInterface` which is a single-consumer interface mirroring a subset of `PrivatbankRowInterface`.

Plan:

1. Both files are absorbed as private methods of `PrivatbankMapper` when that class is built (see mapper consolidation section).
2. `PrivatbankExternalIdInputInterface` is deleted — it is dead indirection once the input is passed directly as `PrivatbankRowInterface` fields inside the class.

## P2: `BaseBankProviderClient` Should Use `ky.create()` Instance

`packages/bank-sync/src/core/client/base-bank-provider.client.ts:65–68` re-assembles HTTP config on every call via `ky(url, { ...options, headers, timeout, retry })`. URL construction uses manual string concatenation (`${this.baseUrl}${endpoint}`) instead of `prefixUrl`. The trailing-slash drift between `MONOBANK_AUTH_URL = 'https://api.monobank.ua/'` and `MONOBANK_API_BASE_URL = 'https://api.monobank.ua'` is a direct consequence.

Plan:

1. In `BaseBankProviderClient` constructor, set `this.httpClient = ky.create({ prefixUrl: baseUrl, retry: { limit: retryLimit ?? 3 }, timeout: timeout ?? 30_000 })`.
2. Per-call method becomes `this.httpClient.get(endpoint, { headers, searchParams }).json<T>()`.
3. Align Monobank URL constants to remove the trailing slash so `prefixUrl` concatenation is consistent.
4. Lift HTTP telemetry (now duplicated in Monobank's `syncLogger` calls) into `beforeRequest`/`afterResponse` ky hooks on the `ky.create()` instance; remove the duplicated `syncLogger` calls from `monobank.client.ts:54–72`.

## P2: `String(error)` Violates Rule 8

`packages/bank-sync/src/core/client/base-bank-provider.client.ts:122` uses `String(error)` for error message extraction. The project standard (rule 8) is `getErrorMessage(error)` from `@rnw-community/shared`.

Plan:

1. Replace `String(error)` with `getErrorMessage(error)` at that line.
2. Verify no other `String(error)` or `error.message` calls exist in bank-sync.

## P2: Manual Unix Time Conversion Should Use date-fns

Three call sites perform manual Unix timestamp math instead of using `date-fns` utilities already in the dependency.

Evidence:

- `packages/bank-sync/src/core/service/base-bank-sync.service.ts:111` — `Math.floor(date.getTime() / 1000)`.
- `packages/bank-sync/src/core/service/base-bank-sync.service.ts:125` — `new Date(transaction.time * 1000)`.
- `packages/bank-sync/src/monobank/client/monobank.client.ts:51` — `Math.floor(Date.now() / 1000)`.
- `packages/bank-sync/src/privatbank/util/parse-privatbank-xlsx.util.ts:37` — manual date parsing via `new Date(Number(year), Number(month)-1, ...)` with manual string splitting. Erste path uses date-fns `parse('dd.MM.yyyy', ...)` correctly.

Plan:

1. Replace `Math.floor(date.getTime() / 1000)` with `getUnixTime(date)` from date-fns.
2. Replace `new Date(transaction.time * 1000)` with `fromUnixTime(transaction.time)` from date-fns.
3. Replace `Math.floor(Date.now() / 1000)` with `getUnixTime(new Date())` or `Math.floor(Date.now() / 1000)` → prefer `getUnixTime(new Date())` for consistency.
4. Replace manual `new Date(Number(year), Number(month)-1, ...)` in `parse-privatbank-xlsx.util.ts` with `parse(dateString, 'dd.MM.yyyy', new Date())` from date-fns, matching the Erste pattern.

## P2: Double-Logged HTTP Calls in Monobank Client

`packages/bank-sync/src/monobank/client/monobank.client.ts:54–72` adds three `syncLogger` calls around a `fetchJson` invocation that already emits HTTP lifecycle logs inside `BaseBankProviderClient.fetchJson`. This is double-logging (rule 41). Erste path does not double-log.

Plan:

1. Remove the three `syncLogger` call sites wrapping `fetchJson` in `monobank.client.ts`.
2. If HTTP telemetry is required at this granularity, move it into `beforeRequest`/`afterResponse` ky hooks on the shared `ky.create()` instance (see ky.create migration section).

## P2: `@Log` on Per-Line Parser Method Should Be Removed

`packages/bank-sync/src/erste/parser/erste-card-merchant.parser.ts:17` carries a `@Log` decorator on a method called once per continuation line during parse — roughly 200–300 lifecycle log entries per typical statement. The bank-sync CLAUDE.md explicitly states state-internal classes called many times per parse should not carry `@Log`. The Erste parser class hierarchy (state classes) is a named exception to `@Log` usage.

Plan:

1. Remove `@Log` from `ErsteCardMerchantParser.parse()`.
2. Keep `@Log` only on the entry-point `ErsteParser.parse()` method.

## P2: `xlsx ^0.18.5` Has Known CVEs

`packages/bank-sync/package.json` depends on `xlsx ^0.18.5` (SheetJS community edition). `yarn npm audit --recursive --all` reports two high-severity advisories for the installed `0.18.5`: GHSA-4r6h-8v6p-xvw6 (prototype pollution, vulnerable `<0.19.3`) and GHSA-5pgg-2g8v-p4x9 (ReDoS, vulnerable `<0.20.2`). This dependency is used only by `parse-privatbank-xlsx.util.ts` (soon `PrivatbankParser`).

Plan:

1. Evaluate replacing `xlsx` with a maintained alternative or a patched SheetJS distribution; do not assume the current npm community package has a safe upgrade path.
2. At minimum, validate and sanitize workbook input before processing to contain the prototype-pollution surface.
3. Track the replacement as part of the `PrivatbankParser` class build so both ship in one PR.

## First Slice

Start with rule alignment:

1. Fix the `erste-card-merchant.parser.ts` guard warning.
2. Remove unused `BaseBankSyncService.delay` if it still has no consumers.
3. Replace `String(error)` with `getErrorMessage(error)` in `BaseBankProviderClient`.
4. Replace manual Unix time math in `base-bank-sync.service.ts` and `monobank.client.ts` with `getUnixTime`/`fromUnixTime`.
5. Promote module-level constants in `BaseBankProviderClient` and `BaseBankSyncService` to `private static readonly` fields.
6. Remove Monobank double-log `syncLogger` calls.
7. Remove `@Log` from `ErsteCardMerchantParser.parse()`.
8. Run `yarn lint`, `yarn ts`, and relevant bank-sync integration tests.
