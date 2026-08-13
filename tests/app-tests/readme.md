# Budgie App Tests

Deterministic iOS E2E flows powered by Argent 0.20.0.

- Self-contained flows: `flows/*.yaml`
- Fixtures: `fixtures/`
- Runner: `scripts/run-argent-suite.sh`
- Runbook: `E2E-RUNBOOK.md`

```bash
yarn workspace @budgie-at/app-tests flows:check
ARGENT_DEVICE=<simulator-udid> yarn workspace @budgie-at/app-tests test:ios
```
