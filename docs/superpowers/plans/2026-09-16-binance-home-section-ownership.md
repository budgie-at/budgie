# Binance Home Section Ownership Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure orphaned Binance sync accounts are associated with their Binance integration before the first provider request so Home never renders a separate `Crypto sync` section for them.

**Architecture:** Keep Home grouping unchanged and repair the persisted ownership invariant inside `AppBinanceSyncService`. Move the existing local association repair ahead of `fetchExchangeAccounts`, then retain the existing account creation and regular-crypto safeguards.

**Tech Stack:** TypeScript, React Native/Expo, Drizzle ORM, Vitest, MSW

---

### Task 1: Reproduce Binance ownership being repaired too late

**Files:**
- Modify: `tests/sync-tests/src/scenarios/binance/account-agnostic-sources.test.ts`

- [ ] **Step 1: Write the failing integration test**

Import `HttpResponse` and `http` from `msw`, and import `mockServer` from `../../harness/scenario/mock-server`. Add a test that inspects the orphan account when Binance makes its first balance request:

```ts
it('associates orphan Binance sync accounts before requesting provider balances', async () => {
    const instrument = seedCryptoInstrument('LTC');
    const orphanExternalId = encodeBinanceAccountId({ wallet: BinanceWalletEnum.SPOT, asset: 'LTC' });
    const orphanAccount = seed.account({
        externalId: orphanExternalId,
        externalSource: ExternalSourceEnum.BINANCE,
        type: AccountTypeEnum.CRYPTO_SYNC,
        instrumentId: instrument.id
    });
    const { externalId } = setupBinanceFixture({ asset: 'BTC', mode: SyncModeEnum.BACKWARD });
    let integrationIdAtFirstProviderRequest: number | null = null;
    mockServer.use(
        http.post('https://api.binance.com/sapi/v3/asset/getUserAsset', () => {
            const [accountAtRequest] = testDb
                .select()
                .from(AccountEntityTable)
                .where(eq(AccountEntityTable.id, orphanAccount.id))
                .all();
            integrationIdAtFirstProviderRequest = accountAtRequest.integrationId;

            return HttpResponse.json([]);
        })
    );

    await binanceSyncService.sync();

    const [seededAccount] = fetchAccountByExternalId(externalId);
    expect(integrationIdAtFirstProviderRequest).toBe(seededAccount.integrationId);
});
```

- [ ] **Step 2: Run the focused test and verify the reproduction fails**

Run:

```bash
pnpm --dir tests/sync-tests exec vitest run src/scenarios/binance/account-agnostic-sources.test.ts -t "associates orphan Binance sync accounts before requesting provider balances" --testTimeout=10000 --reporter=verbose
```

Expected: FAIL because `integrationIdAtFirstProviderRequest` is `null`, proving that the provider request currently starts before local ownership repair.

- [ ] **Step 3: Commit the failing reproduction**

```bash
git add tests/sync-tests/src/scenarios/binance/account-agnostic-sources.test.ts
git commit -m "test(app): reproduce late Binance account association"
```

### Task 2: Repair Binance ownership before network work

**Files:**
- Modify: `packages/app/src/sync/service/binance-sync.service.ts`
- Test: `tests/sync-tests/src/scenarios/binance/account-agnostic-sources.test.ts`

- [ ] **Step 1: Reorder the existing ownership repair**

Change `anchorAllBalances` so integration resolution and orphan association happen before `fetchExchangeAccounts`:

```ts
private async anchorAllBalances(token: string): Promise<number> {
    const integrationId = (await syncIntegrationTokenService.getOrCreateIntegration(this.provider, token)).id;
    const accounts = await accountRepository.findByExternalSource(this.provider);
    await Promise.all(
        accounts
            .filter(account => account.type === AccountTypeEnum.CRYPTO_SYNC && !isDefined(account.integrationId))
            .map(async account => accountRepository.updateById(account.id, { integrationId }))
    );
    const exchangeAccounts = await this.fetchExchangeAccounts(token);
    const exchangeAccountByExternalId = new Map(exchangeAccounts.map(exchangeAccount => [exchangeAccount.id, exchangeAccount]));
    let anchoredCount = 0;
```

Leave the remainder of the balance-anchor loop unchanged. This preserves non-null associations and excludes regular `CRYPTO` accounts.

- [ ] **Step 2: Run the reproduction and verify it passes**

Run:

```bash
pnpm --dir tests/sync-tests exec vitest run src/scenarios/binance/account-agnostic-sources.test.ts -t "associates orphan Binance sync accounts before requesting provider balances" --testTimeout=10000 --reporter=verbose
```

Expected: PASS with the orphan account already associated at the first Binance request.

- [ ] **Step 3: Run the focused Binance regression files**

Run:

```bash
pnpm --dir tests/sync-tests exec vitest run src/scenarios/binance/setup-sync.test.ts src/scenarios/binance/account-agnostic-sources.test.ts --testTimeout=10000
```

Expected: both files pass, including discovered-account repair and regular-crypto isolation.

- [ ] **Step 4: Commit the implementation**

```bash
git add packages/app/src/sync/service/binance-sync.service.ts
git commit -m "fix(app): associate Binance accounts before syncing"
```

### Task 3: Verify the combined bank-sync branch

**Files:**
- Verify: `packages/app/src/sync/service/binance-sync.service.ts`
- Verify: `tests/sync-tests/src/scenarios/binance/account-agnostic-sources.test.ts`

- [ ] **Step 1: Run formatting**

Run `pnpm format`.

Expected: exit code 0; commit formatting changes if any are produced.

- [ ] **Step 2: Run TypeScript validation**

Run `pnpm ts`.

Expected: all workspace TypeScript tasks pass.

- [ ] **Step 3: Run the complete sync integration suite**

Run:

```bash
pnpm --dir tests/sync-tests exec vitest run --testTimeout=10000
```

Expected: all sync integration tests pass.

- [ ] **Step 4: Run repository static checks**

Run `pnpm lint`, `pnpm deadcode`, and `pnpm cpd`.

Expected: zero lint errors, dead-code command exits successfully, and duplication reports zero clones.

- [ ] **Step 5: Confirm the branch is clean**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors and no uncommitted files.
