# Binance Home Section Ownership

## Problem

Binance-managed accounts can appear in two Home sections: `Binance` and `Crypto sync`. Home groups an account under its provider only when the account has a usable integration association. A Binance `CRYPTO_SYNC` account without that association falls back to the generic account-type section.

The existing repair runs during the first sync only after the Binance account request succeeds. A failed, suspended, or interrupted request can therefore leave previously created or legacy Binance sync accounts unassociated and visible under `Crypto sync`.

## Desired Behavior

- Every Binance-managed `CRYPTO_SYNC` account belongs to its Binance integration before transaction synchronization begins.
- Binance-managed accounts appear only in the `Binance` Home section while the initial sync is running, after it succeeds, and after an early provider failure.
- Manually created `CRYPTO` accounts remain outside Binance grouping.
- Existing non-null integration associations are preserved so separate Binance credential groups are not merged.

## Design

The Binance service will establish the integration association at the ownership boundary:

1. Resolve the integration from the current Binance token.
2. Associate eligible orphan accounts before making the provider account request.
3. When Binance adopts an existing account during setup or transaction account resolution, apply the current integration if the account is an unassociated `CRYPTO_SYNC` account.
4. Never rewrite a non-null integration association or associate a regular `CRYPTO` account.

Home rendering will remain unchanged. It will continue to reflect persisted integration ownership instead of masking invalid data with an `externalSource` fallback.

## Error Handling

The ownership repair is local database work and occurs before the first Binance network request. If the provider request then fails or is suspended, the Home grouping remains correct. Existing provider error handling continues unchanged.

## Verification

Add integration coverage that first reproduces an orphan Binance `CRYPTO_SYNC` account remaining outside the Binance integration when the initial provider request cannot complete. The fixed test will verify that the association is persisted before that request resolves or fails.

Existing coverage must continue proving that:

- accounts discovered during sync use the active Binance integration;
- legacy orphan Binance sync accounts are repaired;
- regular crypto accounts are not absorbed into Binance;
- separate non-null integration associations are preserved.

Run the focused Binance integration suite, TypeScript checks, lint, dead-code detection, and duplication detection.
