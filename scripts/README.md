# Repair Scripts

These scripts are one-time SQLite repairs for historical production dumps. Run them only on a copied database first.

## PrivatBank / Monobank Transfer Repair

Use this order for the current historical transfer cleanup:

```bash
cp prod.db prod.fixed.db
sqlite3 prod.fixed.db < scripts/repair-privatbank-duplicate-imports.sql
sqlite3 prod.fixed.db < scripts/repair-monobank-privatbank-transfer-targets.sql
sqlite3 prod.fixed.db < scripts/repair-existing-transfer-privatbank-targets.sql
sqlite3 prod.fixed.db < scripts/repair-privatbank-monobank-grouped-transfer-targets.sql
sqlite3 prod.fixed.db < scripts/repair-monobank-same-bank-currency-conversions.sql
sqlite3 prod.fixed.db "PRAGMA integrity_check;"
```

`repair-monobank-same-bank-currency-conversions.sql` must run last. Earlier repairs can restore old Monobank source rows so ledger history is preserved, and the final pass folds those restored rows into canonical same-bank currency transfers.

On the 2026-05-24 production dump this order left `PRAGMA integrity_check` at `ok` and reduced the known visible suspicious transfer leftovers to `0`.
